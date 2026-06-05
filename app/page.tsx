import GameScreen from "@/components/GameScreen";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-white flex flex-col items-center gap-5 sm:gap-10 px-4 py-5 sm:py-12">
      <h1 className="font-mono text-2xl sm:text-4xl font-bold tracking-tight text-black lowercase">
        dinobase
      </h1>
      <GameScreen />
    </main>
  );
}
