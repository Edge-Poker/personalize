// Reencoda o video da capa com quadro-chave em TODO quadro.
//
// Por que isto existe: percorrer um video com o mouse pede buscas constantes, e
// buscar num video comprimido entre quadros-chave e caro — o decodificador tem
// que voltar ao quadro-chave anterior e decodificar tudo dali ate o ponto
// pedido. Medido no original: teto de ~10 buscas por segundo, com salto medio
// de 0,24s. Nenhum ajuste de JavaScript passa desse teto; e limite do arquivo.
//
// Com todo quadro sendo chave, buscar vira ler: o decodificador pula direto.
// O arquivo engorda — e a troca que faz sentido para 4 segundos de capa.
//
//   swift scripts/reencodar-capa.swift entrada.mp4 saida.mp4 [larguraMax]

import AVFoundation
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("uso: swift scripts/reencodar-capa.swift <entrada> <saida> [larguraMax]")
  exit(1)
}

let entrada = URL(fileURLWithPath: args[1])
let saida = URL(fileURLWithPath: args[2])
let larguraMax = args.count > 3 ? Int(args[3]) ?? 1280 : 1280

let ativo = AVURLAsset(url: entrada)
guard let trilha = ativo.tracks(withMediaType: .video).first else {
  print("nao achei trilha de video"); exit(1)
}

let tamanho = trilha.naturalSize.applying(trilha.preferredTransform)
let largura0 = abs(tamanho.width), altura0 = abs(tamanho.height)
let escala = min(1.0, CGFloat(larguraMax) / largura0)
// Dimensao par: encoder H.264 recusa largura ou altura impar.
let largura = Int((largura0 * escala / 2).rounded()) * 2
let altura = Int((altura0 * escala / 2).rounded()) * 2

print("entrada : \(Int(largura0))x\(Int(altura0)), \(String(format: "%.2f", CMTimeGetSeconds(ativo.duration)))s, \(String(format: "%.1f", trilha.nominalFrameRate)) qps")
print("saida   : \(largura)x\(altura), todo quadro e chave")

try? FileManager.default.removeItem(at: saida)

let leitor = try AVAssetReader(asset: ativo)
let saidaLeitor = AVAssetReaderTrackOutput(
  track: trilha,
  outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
leitor.add(saidaLeitor)

let escritor = try AVAssetWriter(outputURL: saida, fileType: .mp4)
let entradaEscritor = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: largura,
  AVVideoHeightKey: altura,
  AVVideoCompressionPropertiesKey: [
    // 1 = todo quadro e chave. E a linha inteira do arquivo.
    AVVideoMaxKeyFrameIntervalKey: 1,
    AVVideoAverageBitRateKey: 5_000_000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
  ],
])
entradaEscritor.expectsMediaDataInRealTime = false
entradaEscritor.transform = trilha.preferredTransform
escritor.add(entradaEscritor)

leitor.startReading()
escritor.startWriting()
escritor.startSession(atSourceTime: .zero)

let fila = DispatchQueue(label: "reencodar")
let feito = DispatchSemaphore(value: 0)
var quadros = 0

entradaEscritor.requestMediaDataWhenReady(on: fila) {
  while entradaEscritor.isReadyForMoreMediaData {
    guard let amostra = saidaLeitor.copyNextSampleBuffer() else {
      entradaEscritor.markAsFinished()
      escritor.finishWriting { feito.signal() }
      return
    }
    entradaEscritor.append(amostra)
    quadros += 1
  }
}

feito.wait()

if escritor.status == .completed {
  let bytes = (try? FileManager.default.attributesOfItem(atPath: saida.path)[.size] as? Int) ?? 0
  print("pronto  : \(quadros) quadros, \(String(format: "%.2f", Double(bytes ?? 0) / 1048576)) MB")
} else {
  print("falhou: \(escritor.error?.localizedDescription ?? "motivo desconhecido")")
  exit(1)
}
