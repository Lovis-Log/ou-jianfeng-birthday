import { useCallback, useState } from "react";
import HalftoneReveal from "./components/HalftoneReveal";
import Confetti from "./components/Confetti";

const BACKGROUND_SRC = "/bg-photo.jpg";

export default function App() {
  const [surprised, setSurprised] = useState(false);
  const [round, setRound] = useState(0);

  const triggerSurprise = useCallback(() => {
    setSurprised(true);
    setRound((value) => value + 1);
  }, []);

  return (
    <main className="page">
      <section className="hero" aria-label="生日惊喜首页">
        <HalftoneReveal
          src={BACKGROUND_SRC}
          inkColor="#141414"
          paperColor="#f4efe4"
          mode={surprised ? "color" : "mono"}
          dotDensity={90}
          angle={28}
          revealRadius={surprised ? 1.4 : 0.28}
        />

        <div className="hero-content">
          {surprised ? (
            <div className="hero-greeting" aria-live="polite">
              <h1 className="greeting-title">欧建锋，生日快乐！</h1>
              <div className="greeting-blessing">
                <span className="blessing-cn">墨卷收锋，恰是少年从容，</span>
                <span className="blessing-cn">十九新程，且看万里长风。</span>
                <span className="greeting-rule"></span>
                <span className="blessing-en">Books closed, doors open wide,</span>
                <span className="blessing-en">
                  At nineteen, let your dreams be your guide.
                </span>
              </div>
              <button
                className="replay-btn"
                type="button"
                onClick={triggerSurprise}
              >
                再看一次
              </button>
            </div>
          ) : (
            <div className="hero-intro">
              <p className="hero-hint">点一下，拆开今天的惊喜</p>
              <button
                className="surprise-btn"
                type="button"
                onClick={triggerSurprise}
              >
                SURPRISE
              </button>
            </div>
          )}
        </div>
      </section>

      {surprised && <Confetti key={round} />}
    </main>
  );
}
