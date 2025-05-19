import Image from "next/image";
import styles from "./typing-indicator.module.css";

export function TypingIndicator() {
  return (
    <div className="flex items-start ml-0 pl-0">
      <div className={`${styles.animationWrapper} ml-5`}>
        <div className={styles.carAnimation}>
          <Image
            src="/formula-1-svgrepo-com.svg"
            width={85}
            height={60}
            alt="F1 car loading"
            className="h-auto"
          />
        </div>
      </div>
    </div>
  );
}
