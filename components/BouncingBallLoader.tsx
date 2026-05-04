import Image from "next/image";

type BouncingBallLoaderProps = {
  label?: string;
  fullScreen?: boolean;
};

const BouncingBallLoader = ({
  label = "Loading",
  fullScreen = false,
}: BouncingBallLoaderProps) => {
  return (
    <div
      className={
        fullScreen
          ? "flex min-h-[calc(100vh-96px)] items-center justify-center px-6 py-10"
          : "flex items-center justify-center"
      }
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="basketball-loader-scene">
          <Image
            src="/ball.png"
            alt=""
            width={48}
            height={48}
            className="basketball-loader-ball"
            aria-hidden
          />
          <div className="basketball-loader-shadow" aria-hidden />
        </div>
        <p className="text-sm font-semibold text-orange-100">{label}</p>
      </div>
    </div>
  );
};

export default BouncingBallLoader;
