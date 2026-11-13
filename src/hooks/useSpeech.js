import { useEffect, useRef, useState } from "react";
export function useSpeech({ onTranscript, onState, onError }) {
  const recognition = useRef(null),
    utterance = useRef(null),
    active = useRef(false),
    callbacks = useRef({ onTranscript, onState, onError });
  callbacks.current = { onTranscript, onState, onError };
  const [supported] = useState(() =>
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
  );
  const [ttsSupported] = useState(() => Boolean(window.speechSynthesis));
  function stop() {
    active.current = false;
    if (recognition.current) {
      recognition.current.abort();
      recognition.current = null;
    }
    utterance.current = null;
    window.speechSynthesis?.cancel();
  }
  useEffect(() => () => stop(), []);
  function listen() {
    if (recognition.current) {
      recognition.current.stop();
      return;
    }
    if (!supported) {
      callbacks.current.onError(
        "이 브라우저는 음성 입력을 지원하지 않아요. 아래 텍스트 입력으로 연습할 수 있어요.",
      );
      return;
    }
    stop();
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new Recognition();
    recognition.current = rec;
    rec.lang = "ko-KR";
    rec.interimResults = false;
    rec.continuous = false;
    active.current = true;
    let gotResult = false,
      failed = false;
    rec.onresult = (e) => {
      if (!active.current) return;
      gotResult = true;
      recognition.current = null;
      active.current = false;
      callbacks.current.onTranscript(e.results[0][0].transcript);
    };
    rec.onerror = (e) => {
      if (!active.current) return;
      failed = true;
      active.current = false;
      recognition.current = null;
      callbacks.current.onError(
        e.error === "not-allowed"
          ? "마이크 권한이 허용되지 않았어요. 브라우저 사이트 설정에서 권한을 확인하거나 텍스트로 이어가세요."
          : e.error === "network"
            ? "브라우저 음성 인식 연결에 실패했어요. 텍스트로 이어가거나 다시 시도해주세요."
            : "목소리를 인식하지 못했어요. 다시 시도하거나 텍스트로 이어가세요.",
      );
    };
    rec.onend = () => {
      recognition.current = null;
      if (active.current && !gotResult && !failed) {
        active.current = false;
        callbacks.current.onError(
          "인식된 말이 없어요. 다시 시도하거나 텍스트로 입력해주세요.",
        );
      }
    };
    try {
      callbacks.current.onState("listening");
      rec.start();
    } catch {
      stop();
      callbacks.current.onError(
        "마이크를 시작할 수 없어요. 텍스트 입력을 이용해주세요.",
      );
    }
  }
  function speak(text, done) {
    if (!ttsSupported) {
      done?.();
      return;
    }
    stop();
    const u = new SpeechSynthesisUtterance(text);
    utterance.current = u;
    u.lang = "ko-KR";
    u.rate = 0.93;
    u.onend = () => {
      if (utterance.current !== u) return;
      utterance.current = null;
      done?.();
    };
    u.onerror = (e) => {
      if (
        utterance.current !== u ||
        e.error === "canceled" ||
        e.error === "interrupted"
      )
        return;
      utterance.current = null;
      callbacks.current.onError(
        "음성 출력을 마치지 못했어요. 표시된 대화문으로 이어갈 수 있어요.",
      );
    };
    window.speechSynthesis.speak(u);
  }
  return { supported, ttsSupported, listen, stop, speak };
}
