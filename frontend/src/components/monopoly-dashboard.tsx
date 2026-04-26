"use client";

import Image from "next/image";
import {
  BrainCircuit,
  Crown,
  Dices,
  Landmark,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Shield,
  SkipBack,
  SkipForward,
  Sparkles,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type Player = {
  id: string;
  name: string;
  token: string;
  color: string;
  policy_type: "baseline" | "trained";
  policy_label: string;
  cash: number;
  net_worth: number;
  position: number;
  bankrupt: boolean;
  jail_turns: number;
  owned_tiles: number[];
  monopolies: string[];
};

export type Tile = {
  index: number;
  name: string;
  kind: string;
  group: string | null;
  color: string | null;
  price: number;
  base_rent: number;
  upgrade_cost: number;
  owner_id: string | null;
  houses: number;
};

export type Frame = {
  turn_index: number;
  active_player_id: string;
  active_player_name: string;
  active_player_policy_type: "baseline" | "trained";
  active_player_policy_label: string;
  strategy: string;
  dice: number[];
  start_position: number;
  end_position: number;
  landing_tile_index: number;
  landing_tile_name: string;
  landing_tile_kind: string;
  reward: number;
  cash_delta: number;
  net_worth_delta: number;
  drawn_card_deck: "chance" | "community" | null;
  drawn_card_label: string | null;
  reward_breakdown: Record<string, number>;
  events: string[];
  players: Player[];
  board: Tile[];
};

export type Rollout = {
  winner_id: string;
  winner_name: string;
  max_turns: number;
  turns_played: number;
  termination_reason: "bankruptcy" | "safety_limit";
  players: Player[];
  frames: Frame[];
  leaderboard: Player[];
  summary: string[];
};

export type Metrics = {
  avg_reward_first_10: number;
  avg_reward_last_10: number;
  best_net_worth: number;
  showcase_termination_reason?: string;
  showcase_turns?: number;
  episodes_per_trained_agent?: number;
  winner_histogram: Record<string, number>;
  trained_agents?: Array<{
    id: string;
    name: string;
    policy_label: string;
    avg_reward_first_10: number;
    avg_reward_last_10: number;
    best_net_worth: number;
  }>;
};

type MonopolyDashboardProps = {
  initialRollout: Rollout;
  initialMetrics: Metrics;
  apiBase: string;
};

type PlaybackPhase = "title" | "replay" | "winner";
type MusicRuntime = {
  context: AudioContext;
  master: GainNode;
  interval: number;
};

const TITLE_CARD_MS = 3600;
const WINNER_CARD_MS = 5200;
const MONOPOLY_MODEL_NAME = "LinearPolicy PG";
const MONOPOLY_MODEL_DETAIL = "custom RL, no Qwen/Gemma/GPT-OSS checkpoint";

const speedOptions = [
  { label: "Cinematic", value: 3200 },
  { label: "Broadcast", value: 1850 },
  { label: "Replay", value: 1000 },
  { label: "Hyperlapse", value: 222 },
];

const portraitPositions: Record<string, string> = {
  aarya: "0% 50%",
  kabir: "50% 50%",
  meera: "100% 50%",
};

function currency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortCurrency(value: number) {
  if (Math.abs(value) >= 1_00_000) {
    return `${value < 0 ? "-" : "+"}₹${(Math.abs(value) / 1_00_000).toFixed(1)}L`;
  }
  return `${value < 0 ? "-" : "+"}${currency(Math.abs(value))}`;
}

function boardValue(player: Player) {
  return player.net_worth - player.cash;
}

function getBoardPlacement(index: number) {
  if (index <= 10) {
    return { row: 11, column: 11 - index };
  }
  if (index <= 20) {
    return { row: 21 - index, column: 1 };
  }
  if (index <= 30) {
    return { row: 1, column: index - 19 };
  }
  return { row: index - 29, column: 11 };
}

function getTileCenter(index: number, offsetIndex = 0) {
  const { row, column } = getBoardPlacement(index);
  const offsets = [
    { x: -2.2, y: -2.1 },
    { x: 2.2, y: -2.1 },
    { x: 0, y: 2.2 },
  ];
  const offset = offsets[offsetIndex % offsets.length];
  return {
    x: ((column - 0.5) / 11) * 100 + offset.x,
    y: ((row - 0.5) / 11) * 100 + offset.y,
  };
}

function portraitStyle(playerId: string) {
  return {
    backgroundImage: "url('/demo/agents-strip.png')",
    backgroundSize: "300% 100%",
    backgroundPosition: portraitPositions[playerId] ?? "50% 50%",
    backgroundRepeat: "no-repeat",
  } as const;
}

function tokenInitial(player: Player) {
  return player.token.slice(0, 1).toUpperCase();
}

function tileKindLabel(kind: string) {
  return kind.replaceAll("_", " ");
}

function tileSkin(tile: Tile) {
  if (tile.kind === "chance") {
    return "bg-[linear-gradient(145deg,#fff3d7,#f2c36c_48%,#b66c21)]";
  }
  if (tile.kind === "community") {
    return "bg-[linear-gradient(145deg,#f5f8df,#8fd6b2_50%,#24845f)]";
  }
  if (tile.kind === "railroad") {
    return "bg-[linear-gradient(145deg,#fff5df,#d8c19a_45%,#2d2a29)]";
  }
  if (tile.kind === "utility") {
    return "bg-[linear-gradient(145deg,#fff3dc,#f1b861_50%,#7b5420)]";
  }
  if (tile.kind === "tax") {
    return "bg-[linear-gradient(145deg,#fff0d8,#e4b78b_50%,#7f392b)]";
  }
  if (["go", "jail", "free_parking", "go_to_jail"].includes(tile.kind)) {
    return "bg-[linear-gradient(145deg,#fff4dc,#e9cf9e_52%,#8d6228)]";
  }
  return "bg-[linear-gradient(180deg,#fff6e5,#ead2a7)]";
}

function modelName(player: Player) {
  if (player.policy_type === "baseline") {
    return "Heuristic rules baseline";
  }
  return player.id === "kabir"
    ? "LinearPolicy PG · Alpha"
    : "LinearPolicy PG · Beta";
}

function trainingLevel(player: Player) {
  if (player.policy_type === "baseline") {
    return "Reference bot · not trained";
  }
  return player.id === "kabir" ? "RL Level 1 · 28 episodes" : "RL Level 2 · 28 episodes";
}

function boardModelLabel(player: Player) {
  if (player.policy_type === "baseline") {
    return "Heuristic Bot";
  }
  return player.id === "kabir" ? "Linear PG A · RL L1" : "Linear PG B · RL L2";
}

function modelizeText(text: string, players: Player[]) {
  return players.reduce(
    (updated, player) => updated.replaceAll(player.name, boardModelLabel(player)),
    text,
  );
}

function speedName(speed: number) {
  return speedOptions.find((option) => option.value === speed)?.label ?? "Custom";
}

function speedRate(speed: number) {
  return `${(1000 / speed).toFixed(speed < 200 ? 1 : 1)} turns/sec`;
}

function roleBadge(player: Player) {
  if (player.policy_type === "baseline") {
    return {
      label: "Baseline",
      icon: <Shield className="h-3.5 w-3.5" />,
      className: "border-amber-300 bg-amber-50 text-amber-700",
    };
  }
  return {
    label: "RL Trained",
    icon: <BrainCircuit className="h-3.5 w-3.5" />,
    className: "border-emerald-300 bg-emerald-50 text-emerald-700",
  };
}

function formatStrategyLabel(strategy: string) {
  return strategy.replaceAll("_", " ");
}

function deltaClass(value: number) {
  if (value > 0) {
    return "text-[#98ffc8]";
  }
  if (value < 0) {
    return "text-[#ff9c9c]";
  }
  return "text-[#fff1d8]";
}

export default function MonopolyDashboard({
  initialRollout,
  initialMetrics,
  apiBase,
}: MonopolyDashboardProps) {
  const [rollout, setRollout] = useState(initialRollout);
  const [metrics, setMetrics] = useState(initialMetrics);
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(220);
  const [phase, setPhase] = useState<PlaybackPhase>("replay");
  const [isBoardFocus, setIsBoardFocus] = useState(false);
  const [musicOn, setMusicOn] = useState(false);
  const musicRef = useRef<MusicRuntime | null>(null);
  const [liveStatus, setLiveStatus] = useState(apiBase ? "Connecting to trained rollout API" : "Bundled bankruptcy replay");

  const startReplay = (fromStart = false) => {
    setPhase("replay");
    if (fromStart || frameIndex >= rollout.frames.length - 1) {
      setFrameIndex(0);
    }
    setIsPlaying(true);
  };

  const deferredFrameIndex = useDeferredValue(frameIndex);
  const currentFrame = rollout.frames[deferredFrameIndex] ?? rollout.frames[0];
  const previousFrame =
    deferredFrameIndex > 0 ? rollout.frames[deferredFrameIndex - 1] : undefined;
  const currentPlayers = currentFrame?.players ?? rollout.players;
  const currentBoard = currentFrame?.board ?? rollout.frames[0]?.board ?? [];
  const playersById = useMemo(
    () => new Map(currentPlayers.map((player) => [player.id, player])),
    [currentPlayers],
  );

  const playersByPosition = useMemo(() => {
    const groups = new Map<number, Player[]>();
    for (const player of currentPlayers) {
      const bucket = groups.get(player.position) ?? [];
      bucket.push(player);
      groups.set(player.position, bucket);
    }
    return groups;
  }, [currentPlayers]);

  const deltasByPlayer = useMemo(() => {
    const deltas = new Map<
      string,
      { cashDelta: number; netWorthDelta: number; boardDelta: number }
    >();
    const previous = new Map((previousFrame?.players ?? []).map((player) => [player.id, player]));
    for (const player of currentPlayers) {
      const prev = previous.get(player.id);
      const cashDelta = prev ? player.cash - prev.cash : 0;
      const netWorthDelta = prev ? player.net_worth - prev.net_worth : 0;
      deltas.set(player.id, {
        cashDelta,
        netWorthDelta,
        boardDelta: netWorthDelta - cashDelta,
      });
    }
    return deltas;
  }, [currentPlayers, previousFrame]);

  useEffect(() => {
    if (!isPlaying) {
      return;
    }
    const delay =
      phase === "title" ? TITLE_CARD_MS : phase === "winner" ? WINNER_CARD_MS : speed;
    const timer = window.setTimeout(() => {
      if (phase === "title") {
        setPhase("replay");
        setFrameIndex(0);
        return;
      }
      if (phase === "winner") {
        setPhase("replay");
        setFrameIndex(0);
        return;
      }
      setFrameIndex((current) => {
        if (current >= rollout.frames.length - 1) {
          setPhase("winner");
          return current;
        }
        return current + 1;
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [frameIndex, isPlaying, phase, speed, rollout.frames.length]);

  useEffect(() => {
    if (!apiBase) {
      return;
    }
    let ignore = false;
    const base = apiBase.replace(/\/$/, "");
    Promise.all([
      fetch(`${base}/demo/rollout`).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      }),
      fetch(`${base}/demo/metrics`).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      }),
    ])
      .then(([rolloutPayload, metricsPayload]: [Rollout, Metrics]) => {
        if (ignore) {
          return;
        }
        setRollout(rolloutPayload);
        setMetrics(metricsPayload);
        setFrameIndex(0);
        setPhase("replay");
        setLiveStatus("Live trained rollout API");
      })
      .catch(() => {
        if (!ignore) {
          setLiveStatus("Bundled bankruptcy replay");
        }
      });
    return () => {
      ignore = true;
    };
  }, [apiBase]);

  useEffect(() => {
    if (!musicOn) {
      if (musicRef.current) {
        musicRef.current.master.gain.setTargetAtTime(0, musicRef.current.context.currentTime, 0.08);
        window.clearInterval(musicRef.current.interval);
        window.setTimeout(() => {
          void musicRef.current?.context.close();
          musicRef.current = null;
        }, 180);
      }
      return;
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }

    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = 0.045;
    master.connect(context.destination);

    const notes = [146.83, 196, 220, 246.94, 293.66, 246.94, 220, 196];
    let step = 0;
    const playNote = () => {
      const now = context.currentTime;
      const bass = context.createOscillator();
      const bassGain = context.createGain();
      bass.type = "triangle";
      bass.frequency.value = notes[step % notes.length];
      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);
      bass.connect(bassGain).connect(master);
      bass.start(now);
      bass.stop(now + 0.44);

      const shimmer = context.createOscillator();
      const shimmerGain = context.createGain();
      shimmer.type = "sine";
      shimmer.frequency.value = notes[(step + 2) % notes.length] * 2;
      shimmerGain.gain.setValueAtTime(0.0001, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.035, now + 0.04);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      shimmer.connect(shimmerGain).connect(master);
      shimmer.start(now);
      shimmer.stop(now + 0.3);
      step += 1;
    };

    playNote();
    const interval = window.setInterval(playNote, 360);
    musicRef.current = { context, master, interval };

    return () => {
      window.clearInterval(interval);
      master.gain.setTargetAtTime(0, context.currentTime, 0.08);
      window.setTimeout(() => void context.close(), 180);
      musicRef.current = null;
    };
  }, [musicOn]);

  const winner = rollout.leaderboard[0];
  const titlePlayer = rollout.players.find((player) => player.id === "kabir") ?? rollout.players[0];
  const turnWindowStart = Math.max(0, deferredFrameIndex - 3);
  const recentFrames = rollout.frames.slice(turnWindowStart, deferredFrameIndex + 1).reverse();
  const progress = rollout.frames.length
    ? ((deferredFrameIndex + 1) / rollout.frames.length) * 100
    : 0;
  const currentPlayer = currentPlayers.find(
    (player) => player.id === currentFrame?.active_player_id,
  );
  const rankedPlayers = useMemo(
    () =>
      [...currentPlayers].sort(
        (left, right) =>
          right.net_worth - left.net_worth ||
          right.cash - left.cash ||
          boardValue(right) - boardValue(left),
      ),
    [currentPlayers],
  );
  const moveHeadline = modelizeText(currentFrame?.events[0] ?? "Rollout ready", currentPlayers);
  const moveFollowup = modelizeText(
    currentFrame?.events.slice(1).join(" ") ??
      "One baseline player faces two separately trained RL policies.",
    currentPlayers,
  );
  const landingTile =
    currentBoard.find((tile) => tile.index === currentFrame?.landing_tile_index) ?? null;
  const landingTileOwner = landingTile?.owner_id ? playersById.get(landingTile.owner_id) : null;
  const diceTotal =
    currentFrame?.dice.reduce((sum, value) => sum + value, 0) ?? 0;
  const showTitleCard = phase === "title";
  const showWinnerCard = phase === "winner";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#2f1b10_0%,#170f0a_34%,#0d0906_100%)] text-[#f9edd8]">
      <div className={`mx-auto flex min-h-screen flex-col gap-6 px-4 py-4 sm:px-6 lg:px-8 ${
        isBoardFocus ? "max-w-[1500px] bg-[#090604]" : "max-w-[1700px]"
      }`}>
        {!isBoardFocus ? (
        <header className="overflow-hidden border border-[#f6d29c33] bg-[linear-gradient(135deg,rgba(42,23,11,0.96),rgba(18,12,8,0.92))] shadow-[0_22px_90px_rgba(0,0,0,0.4)]">
          <div className="grid gap-5 px-5 py-5 lg:grid-cols-[1.5fr_0.9fr] lg:px-7">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d4b88b]">
                <span className="rounded-full border border-[#f6d29c55] bg-[#f5c46f15] px-3 py-1 text-[#f4d39d]">
                  Theme 1
                </span>
                <span className="rounded-full border border-[#f6d29c22] px-3 py-1">
                  Multi-agent interactions
                </span>
                <span className="rounded-full border border-[#22c55e55] bg-[#0c241933] px-3 py-1 text-[#97efbb]">
                  {rollout.termination_reason === "bankruptcy"
                    ? "Replay ends on bankruptcy"
                    : "Replay hit safety ceiling"}
                </span>
              </div>
              <div className="space-y-1.5">
                <h1 className="max-w-5xl text-4xl font-semibold leading-[0.95] sm:text-5xl lg:text-[3.9rem]">
                  OpenMonopoly India
                </h1>
                <p className="max-w-4xl text-sm leading-6 text-[#dbc6a8] sm:text-base">
                  Replay of agents playing against each other: heuristic baseline vs RL.
                </p>
                <div className="inline-flex rounded-full border border-[#f6d29c22] bg-[#120c08] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d7bc93]">
                  {liveStatus}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <TopStat
                icon={<Crown className="h-4 w-4" />}
                label="Winner"
                value={winner?.name ?? "Pending"}
              />
              <TopStat
                icon={<Dices className="h-4 w-4" />}
                label="Turns"
                value={`${deferredFrameIndex + 1} / ${rollout.turns_played}`}
              />
              <TopStat
                icon={<TrendingUp className="h-4 w-4" />}
                label="Best Net Worth"
                value={currency(metrics.best_net_worth)}
              />
              <TopStat
                icon={<Sparkles className="h-4 w-4" />}
                label="Model"
                value={MONOPOLY_MODEL_NAME}
                detail={MONOPOLY_MODEL_DETAIL}
              />
            </div>
          </div>
        </header>
        ) : null}

        <section className={`grid gap-6 ${isBoardFocus ? "" : "xl:grid-cols-[minmax(0,1fr)_360px]"}`}>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-[#f6d29c22] bg-[#24170f] px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
              <div className="flex flex-wrap items-center gap-2">
                <ControlButton
                  onClick={() => {
                    setPhase("replay");
                    setIsPlaying(false);
                    setFrameIndex((current) => Math.max(0, current - 1));
                  }}
                  icon={<SkipBack className="h-4 w-4" />}
                  label="Previous"
                />
                <ControlButton
                  onClick={() => {
                    if (isPlaying) {
                      setIsPlaying(false);
                      return;
                    }
                    startReplay(false);
                  }}
                  icon={isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  label={isPlaying ? "Pause" : "Play"}
                  emphasized
                />
                <ControlButton
                  onClick={() => {
                    setPhase("replay");
                    setIsPlaying(false);
                    setFrameIndex((current) =>
                      Math.min(rollout.frames.length - 1, current + 1),
                    );
                  }}
                  icon={<SkipForward className="h-4 w-4" />}
                  label="Next"
                />
                <ControlButton
                  onClick={() => startReplay(true)}
                  icon={<Play className="h-4 w-4" />}
                  label="Start Replay"
                  emphasized={!isPlaying}
                />
                <ControlButton
                  onClick={() => {
                    setPhase("title");
                    setFrameIndex(0);
                    setIsPlaying(true);
                  }}
                  icon={<RotateCcw className="h-4 w-4" />}
                  label="Replay Intro"
                />
                <ControlButton
                  onClick={() => setIsBoardFocus((current) => !current)}
                  icon={isBoardFocus ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  label={isBoardFocus ? "Exit Board" : "Board Focus"}
                  emphasized={isBoardFocus}
                />
                <ControlButton
                  onClick={() => setMusicOn((current) => !current)}
                  icon={musicOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  label={musicOn ? "Music On" : "Music Off"}
                  emphasized={musicOn}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-full border border-[#22c55e55] bg-[#062416] px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-[#a7f3d0] shadow-[0_0_22px_rgba(34,197,94,0.14)]">
                  Speed · {speedName(speed)} · {speedRate(speed)}
                </div>
                {speedOptions.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => {
                      setSpeed(option.value);
                      startReplay(phase !== "replay" || frameIndex >= rollout.frames.length - 1);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                      speed === option.value
                        ? "border-[#f6d29c88] bg-[#f6d29c22] text-[#fff0d0]"
                        : "border-[#f6d29c22] bg-[#130d09] text-[#d5bc98] hover:border-[#f6d29c55]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={`relative grid aspect-square grid-cols-11 grid-rows-11 overflow-hidden rounded-[34px] border-[10px] border-[#b17b39] bg-[radial-gradient(circle_at_top,#7f5729_0%,#56391c_16%,#24160e_58%,#120c08_100%)] shadow-[0_35px_120px_rgba(0,0,0,0.5)] ${
              isBoardFocus ? "mx-auto w-[min(94vw,calc(100vh-132px))]" : ""
            }`}>
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_20%,transparent_80%,rgba(0,0,0,0.16))]" />

              {currentBoard.map((tile) => {
                const placement = getBoardPlacement(tile.index);
                const occupants = playersByPosition.get(tile.index) ?? [];
                const activeLanding = currentFrame?.landing_tile_index === tile.index;
                const isCorner = [0, 10, 20, 30].includes(tile.index);
                const owner = tile.owner_id ? playersById.get(tile.owner_id) : null;

                return (
                  <div
                    key={tile.index}
                    className={`relative overflow-hidden border border-[#2f1c0d] p-1.5 text-[#21140b] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)] ${tileSkin(tile)} ${
                      activeLanding ? "tile-flash z-10" : ""
                    }`}
                    style={{
                      gridColumnStart: placement.column,
                      gridRowStart: placement.row,
                    }}
                  >
                    {tile.color ? (
                      <div
                        className="absolute inset-x-0 top-0 h-3.5 border-b border-[#2f1c0d99] shadow-[inset_0_-1px_0_rgba(255,255,255,0.35)]"
                        style={{ backgroundColor: tile.color }}
                      />
                    ) : null}
                    {tile.kind === "chance" || tile.kind === "community" ? (
                      <div className="absolute right-1 top-5 grid h-7 w-5 place-items-center rounded-[3px] border border-[#3b2412aa] bg-[#fff7e6cc] text-[10px] font-black text-[#3a2312] shadow-[0_4px_10px_rgba(0,0,0,0.25)]">
                        {tile.kind === "chance" ? "?" : "C"}
                      </div>
                    ) : null}
                    {tile.kind === "railroad" ? (
                      <div className="absolute right-1 top-5 text-[13px] font-black text-[#1b1714]">RR</div>
                    ) : null}
                    <div className={`mt-4 flex h-full flex-col justify-between gap-1 ${isCorner ? "pb-1" : ""}`}>
                      <div className="space-y-1">
                        <div className="text-[8px] font-black uppercase tracking-[0.18em] text-[#6c5233]">
                          {tileKindLabel(tile.kind)}
                        </div>
                        <div className="max-w-[92%] text-[10px] font-black leading-tight sm:text-[11px]">
                          {tile.name}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {tile.price > 0 ? (
                          <div className="inline-flex rounded-full bg-[#fff8e8aa] px-1.5 py-0.5 text-[10px] font-bold text-[#5c4225]">
                            {currency(tile.price)}
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between gap-2">
                          <div className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] ${
                            owner ? "bg-[#120b08d9] text-[#fff2d6]" : "bg-[#6d513022] text-[#7d6547]"
                          }`}>
                            <span
                              className="h-1.5 w-1.5 rounded-full"
                              style={{ backgroundColor: owner?.color ?? "#aa8965" }}
                            />
                            {owner ? boardModelLabel(owner) : "open"}
                          </div>
                          {tile.houses > 0 ? (
                            <div className="flex gap-1">
                              {Array.from({ length: tile.houses }).map((_, index) => (
                                <span
                                  key={`${tile.index}-${index}`}
                                  className="h-1.5 w-1.5 rounded-full bg-[#17984c]"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {occupants.length > 0 ? (
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        {occupants.map((player) => (
                          <span
                            key={player.id}
                            className="h-2.5 w-2.5 rounded-full border border-[#130d09]"
                            style={{ backgroundColor: player.color }}
                            title={`${boardModelLabel(player)} · ${player.policy_label}`}
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}

              <BoardTokenLayer
                players={currentPlayers}
                frame={currentFrame}
                previousFrame={previousFrame}
              />

              <div className="relative col-[2_/_11] row-[2_/_11] overflow-hidden bg-[radial-gradient(circle_at_50%_8%,rgba(255,220,168,0.14),rgba(30,19,12,0.96)_46%,rgba(12,8,6,0.99)_100%)] p-5">
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,245,220,0.08),transparent_24%,rgba(0,0,0,0.28)_100%)]" />
                <div className="pointer-events-none absolute inset-x-[9%] top-[50%] h-px bg-[linear-gradient(90deg,transparent,rgba(246,210,156,0.28),transparent)]" />

                <div className="relative z-10 flex h-full flex-col justify-between gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StageTag icon={<Landmark className="h-3.5 w-3.5" />} label={`Turn ${currentFrame?.turn_index} of ${rollout.turns_played}`} />
                      <StageTag
                        icon={currentPlayer?.policy_type === "baseline" ? <Shield className="h-3.5 w-3.5" /> : <BrainCircuit className="h-3.5 w-3.5" />}
                        label={currentPlayer ? modelName(currentPlayer) : MONOPOLY_MODEL_NAME}
                        accent
                      />
                      <StageTag icon={<Sparkles className="h-3.5 w-3.5" />} label={formatStrategyLabel(currentFrame?.strategy ?? "opening_move")} />
                    </div>

                    <div className="rounded-[24px] border border-[#f6d29c33] bg-[#100a07] px-4 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d5bd97]">
                        Move reward
                      </div>
                      <div className={`mt-2 text-3xl font-semibold ${deltaClass(currentFrame?.reward ?? 0)}`}>
                        {currentFrame?.reward && currentFrame.reward > 0 ? "+" : ""}
                        {currentFrame?.reward.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="grid flex-1 items-stretch gap-5 xl:grid-cols-[minmax(0,1fr)_290px]">
                    <div className="relative flex min-h-0 flex-col justify-between overflow-hidden rounded-[18px] border border-[#f6d29c38] bg-[radial-gradient(circle_at_20%_0%,rgba(246,210,156,0.18),rgba(23,14,9,0.94)_48%,rgba(11,7,5,0.98)_100%)] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)]">
                      <div className="pointer-events-none absolute right-[-8%] top-[-18%] text-[12rem] font-semibold leading-none text-[#f6d29c08]">
                        {diceTotal}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-[#f6d29c33] bg-[#140d09bf] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f0d4a3]">
                            Live move
                          </span>
                          <span className="rounded-full border border-[#f6d29c22] bg-[#140d09a1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d3b88f]">
                            {currentPlayer ? boardModelLabel(currentPlayer) : "Policy"} · {currentPlayer?.token} token
                          </span>
                        </div>
                        <div key={`headline-${deferredFrameIndex}`} className="headline-pop mt-4 space-y-3">
                              <h2 className="max-w-4xl text-[2.85rem] font-semibold leading-[0.92] text-[#fff7eb] xl:text-[4.45rem]">
                            {moveHeadline}
                          </h2>
                          <p className="max-w-3xl text-lg leading-7 text-[#e1ccb0]">
                            {moveFollowup}
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 xl:grid-cols-4">
                        <StageMetric
                          label="Lands on"
                          value={currentFrame?.landing_tile_name ?? "Ready"}
                          detail={currentFrame?.landing_tile_kind?.replaceAll("_", " ") ?? "board tile"}
                        />
                        <StageMetric
                          label="Dice total"
                          value={String(diceTotal)}
                          detail={`${currentFrame?.dice[0] ?? 0} + ${currentFrame?.dice[1] ?? 0}`}
                        />
                        <StageMetric
                          label="Cash swing"
                          value={shortCurrency(currentFrame?.cash_delta ?? 0)}
                          detail={currentFrame?.cash_delta === 0 ? "no immediate change" : "this move only"}
                          tone={currentFrame?.cash_delta ?? 0}
                        />
                        <StageMetric
                          label="Net swing"
                          value={shortCurrency(currentFrame?.net_worth_delta ?? 0)}
                          detail={landingTileOwner ? `owned by ${landingTileOwner.name}` : "open board pressure"}
                          tone={currentFrame?.net_worth_delta ?? 0}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {currentPlayers.map((player) => (
                          <CompactFinanceCard
                            key={`center-score-${player.id}-${currentFrame?.turn_index ?? 0}`}
                            player={player}
                            isActive={player.id === currentFrame?.active_player_id}
                            deltas={
                              deltasByPlayer.get(player.id) ?? {
                                cashDelta: 0,
                                netWorthDelta: 0,
                                boardDelta: 0,
                              }
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <div className="grid min-h-0 gap-4">
                      <div className="rounded-[18px] border border-[#f6d29c33] bg-[linear-gradient(180deg,rgba(34,21,12,0.94),rgba(16,10,7,0.98))] p-4 shadow-[0_18px_48px_rgba(0,0,0,0.38)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d7bc93]">
                            <Dices className="h-4 w-4" />
                            Dice chamber
                          </div>
                          <div className="text-xs text-[#cdb28b]">dramatic roll</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {(currentFrame?.dice ?? []).map((die, index) => (
                            <DiceFace
                              key={`${die}-${index}-${deferredFrameIndex}`}
                              value={die}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <DeckCard
                          title="Chance"
                          active={currentFrame?.drawn_card_deck === "chance"}
                          reveal={currentFrame?.drawn_card_deck === "chance" ? currentFrame.drawn_card_label : null}
                        />
                        <DeckCard
                          title="Community"
                          active={currentFrame?.drawn_card_deck === "community"}
                          reveal={currentFrame?.drawn_card_deck === "community" ? currentFrame.drawn_card_label : null}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {showTitleCard ? (
                <div className="capture-overlay title-overlay absolute inset-[9%] z-30 flex items-center justify-center rounded-[34px] border border-[#f6d29c55] bg-[radial-gradient(circle_at_top,rgba(71,42,18,0.72),rgba(19,12,7,0.96)_55%,rgba(10,6,4,0.98)_100%)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
                  <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[320px_1fr]">
                    <div
                      className="agent-float h-[340px] rounded-[30px] border border-[#ffffff14] bg-cover bg-center shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
                      style={portraitStyle(titlePlayer?.id ?? "kabir")}
                    />
                    <div className="flex flex-col justify-center gap-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f4d39d]">
                        Capture Sequence
                      </div>
                      <h2 className="text-4xl font-semibold leading-[0.94] text-[#fff3de] sm:text-5xl lg:text-[4.4rem]">
                        OpenMonopoly India
                      </h2>
                      <p className="max-w-3xl text-base leading-7 text-[#dbc6a8] sm:text-lg">
                        Heuristic baseline versus two trained RL agents on a
                        bankruptcy-ending Monopoly board built from Indian city names.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {rollout.players.map((player) => {
                          const role = roleBadge(player);
                          return (
                            <div
                              key={`title-${player.id}`}
                              className="rounded-[24px] border border-[#f6d29c22] bg-[#160d09c7] px-4 py-3"
                            >
                              <div className="text-lg font-semibold text-[#fff1d8]">
                                {player.name}
                              </div>
                              <div className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${role.className}`}>
                                {role.icon}
                                {role.label}
                              </div>
                              <div className="mt-3 text-sm text-[#d7c1a2]">
                                {player.policy_label}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {showWinnerCard && winner ? (
                <div className="capture-overlay winner-overlay absolute inset-[9%] z-30 flex items-center justify-center rounded-[34px] border border-[#f6d29c66] bg-[radial-gradient(circle_at_top,rgba(112,72,26,0.44),rgba(19,12,7,0.96)_50%,rgba(10,6,4,0.98)_100%)] p-6 shadow-[0_40px_120px_rgba(0,0,0,0.58)]">
                  <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[340px_1fr]">
                    <div
                      className="piece-pulse h-[360px] rounded-[32px] border border-[#f6d29c55] bg-cover bg-center shadow-[0_24px_70px_rgba(0,0,0,0.38)]"
                      style={portraitStyle(winner.id)}
                    />
                    <div className="flex flex-col justify-center gap-4">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f4d39d]">
                        Winner Frame
                      </div>
                      <h2 className="text-4xl font-semibold leading-[0.94] text-[#fff3de] sm:text-5xl lg:text-[4.6rem]">
                        {winner.name} Wins the Board
                      </h2>
                      <p className="max-w-3xl text-base leading-7 text-[#dbc6a8] sm:text-lg">
                        {winner.policy_label} survives the bankruptcy finish with{" "}
                        <span className="font-semibold text-[#fff3de]">
                          {currency(winner.net_worth)}
                        </span>{" "}
                        in total value.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-3">
                        <MiniMeta label="Termination" value={rollout.termination_reason} />
                        <MiniMeta label="Turns played" value={String(rollout.turns_played)} />
                        <MiniMeta label="Cash in hand" value={currency(winner.cash)} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {!isBoardFocus ? (
          <aside className="grid content-start gap-4">
            <section className="rounded-[24px] border border-[#f6d29c2f] bg-[linear-gradient(180deg,#25170f,#130c08)] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.36)]">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6bb93]">
                    Live agent rank
                  </div>
                  <div className="mt-1 text-xs text-[#bda17c]">
                    sorted by total net worth
                  </div>
                </div>
                <div className="rounded-full border border-[#f6d29c33] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#f4d39d]">
                  Turn {currentFrame?.turn_index}
                </div>
              </div>

              <div className="grid gap-3">
                {rankedPlayers.map((player, index) => {
                  const previousRank =
                    previousFrame?.players
                      ?.slice()
                      .sort(
                        (left, right) =>
                          right.net_worth - left.net_worth ||
                          right.cash - left.cash ||
                          boardValue(right) - boardValue(left),
                      )
                      .findIndex((item) => item.id === player.id) ?? index;
                  return (
                    <RankedAgentCard
                      key={`${player.id}-${index}-${currentFrame?.turn_index}`}
                      player={player}
                      rank={index + 1}
                      rankDelta={previousRank - index}
                      active={player.id === currentFrame?.active_player_id}
                      deltas={
                        deltasByPlayer.get(player.id) ?? {
                          cashDelta: 0,
                          netWorthDelta: 0,
                          boardDelta: 0,
                        }
                      }
                    />
                  );
                })}
              </div>
            </section>
          </aside>
          ) : null}
        </section>

        {!isBoardFocus ? (
        <section className="grid items-start gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-[32px] border border-[#f6d29c22] bg-[linear-gradient(180deg,#24170f,#150d09)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d6bb93]">
                Turn feed
              </div>
              <div className="text-xs text-[#cdb28b]">
                Last {recentFrames.length} resolved moves
              </div>
            </div>
            <div className="grid gap-3">
              {recentFrames.map((frame) => (
                <div
                  key={`feed-${frame.turn_index}`}
                  className={`rounded-[24px] border p-4 ${
                    frame.turn_index === currentFrame?.turn_index
                      ? "border-[#f6d29c66] bg-[#2a1a0f]"
                      : "border-[#f6d29c22] bg-[#1a110c]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm uppercase tracking-[0.18em] text-[#d5ba90]">
                        Turn {frame.turn_index}
                      </div>
                      <div className="mt-1 text-lg font-semibold text-[#fff1d8]">
                        {frame.active_player_name} · {frame.active_player_policy_label}
                      </div>
                    </div>
                    <div className="rounded-full border border-[#f6d29c33] px-3 py-1 text-sm font-semibold text-[#fff1d8]">
                      {frame.strategy.replaceAll("_", " ")}
                    </div>
                  </div>
                  <div className="mt-3 text-sm leading-6 text-[#dfcab0]">
                    {frame.events.join(" ")}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-[#f6d29c22] bg-[linear-gradient(180deg,#24170f,#150d09)] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.32)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d6bb93]">
                Training
              </div>
              <div className="text-xs text-[#cdb28b]">
                {metrics.episodes_per_trained_agent ?? 0} episodes per RL agent
              </div>
            </div>
            <div className="overflow-hidden rounded-[26px] border border-[#f6d29c22] bg-[#120c08]">
              <Image
                src="/demo/training_curve.png"
                alt="Training reward curves for the two RL agents"
                width={1200}
                height={630}
                className="max-h-[320px] w-full object-contain bg-white"
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(metrics.trained_agents ?? []).map((agent) => (
                <div
                  key={agent.id}
                  className="rounded-[24px] border border-[#f6d29c22] bg-[#1a110c] p-3"
                >
                  <div className="text-lg font-semibold text-[#fff1d8]">
                    {agent.name}
                  </div>
                  <div className="mt-1 text-sm text-[#d4bd98]">{agent.policy_label}</div>
                  <div className="mt-3 grid gap-2">
                    <MiniMeta label="First 10 avg reward" value={agent.avg_reward_first_10.toFixed(2)} />
                    <MiniMeta label="Last 10 avg reward" value={agent.avg_reward_last_10.toFixed(2)} />
                    <MiniMeta label="Peak net worth" value={currency(agent.best_net_worth)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </section>
        ) : null}
      </div>
    </main>
  );
}

function TopStat({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[24px] border border-[#f6d29c22] bg-[#130d09] px-4 py-3">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d6bb93]">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-lg font-semibold text-[#fff1d8]">{value}</div>
      {detail ? <div className="mt-1 text-xs leading-5 text-[#b99f7a]">{detail}</div> : null}
    </div>
  );
}

function ControlButton({
  onClick,
  icon,
  label,
  emphasized = false,
  beforeAction,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  emphasized?: boolean;
  beforeAction?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        beforeAction?.();
        onClick();
      }}
      className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition ${
        emphasized
          ? "border-[#f6d29c88] bg-[#f6d29c20] text-[#fff0d0] hover:bg-[#f6d29c30]"
          : "border-[#f6d29c22] bg-[#130d09] text-[#d5bc98] hover:border-[#f6d29c55]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function BoardTokenLayer({
  players,
  frame,
  previousFrame,
}: {
  players: Player[];
  frame: Frame | undefined;
  previousFrame: Frame | undefined;
}) {
  const grouped = useMemo(() => {
    const groups = new Map<number, Player[]>();
    for (const player of players) {
      const bucket = groups.get(player.position) ?? [];
      bucket.push(player);
      groups.set(player.position, bucket);
    }
    return groups;
  }, [players]);

  const previousById = useMemo(
    () => new Map((previousFrame?.players ?? []).map((player) => [player.id, player])),
    [previousFrame],
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {players.map((player) => {
        const bucket = grouped.get(player.position) ?? [];
        const offsetIndex = Math.max(0, bucket.findIndex((item) => item.id === player.id));
        const to = getTileCenter(player.position, offsetIndex);
        const previousPosition =
          player.id === frame?.active_player_id
            ? frame.start_position
            : previousById.get(player.id)?.position ?? player.position;
        const from = getTileCenter(previousPosition, offsetIndex);
        const active = player.id === frame?.active_player_id;
        return (
          <BoardToken
            key={`${player.id}-${frame?.turn_index ?? 0}`}
            player={player}
            active={active}
            from={from}
            to={to}
          />
        );
      })}
      {frame ? (
        <MoveTrail
          key={`trail-${frame.turn_index}`}
          from={getTileCenter(frame.start_position)}
          to={getTileCenter(frame.end_position)}
        />
      ) : null}
    </div>
  );
}

function BoardToken({
  player,
  active,
  from,
  to,
}: {
  player: Player;
  active: boolean;
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  return (
    <div
      className={`board-piece ${active ? "board-piece-active" : ""}`}
      style={
        {
          "--from-x": `${from.x}%`,
          "--from-y": `${from.y}%`,
          "--to-x": `${to.x}%`,
          "--to-y": `${to.y}%`,
          "--piece-color": player.color,
        } as React.CSSProperties
      }
      title={`${boardModelLabel(player)} ${player.token} token`}
    >
      <div className="board-piece-head">{tokenInitial(player)}</div>
      <div className="board-piece-neck" />
      <div className="board-piece-base" />
      <div className="board-piece-label">{boardModelLabel(player)}</div>
    </div>
  );
}

function MoveTrail({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}) {
  const left = Math.min(from.x, to.x);
  const top = Math.min(from.y, to.y);
  const width = Math.max(2, Math.abs(to.x - from.x));
  const height = Math.max(2, Math.abs(to.y - from.y));
  return (
    <div
      className="move-trail"
      style={
        {
          left: `${left}%`,
          top: `${top}%`,
          width: `${width}%`,
          height: `${height}%`,
        } as React.CSSProperties
      }
    />
  );
}

function DiceFace({ value }: { value: number }) {
  const activePips: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
  };
  const active = new Set(activePips[value] ?? []);
  return (
    <div className="dice-face dice-roll" aria-label={`Die rolled ${value}`}>
      {Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className={active.has(index) ? "dice-pip dice-pip-active" : "dice-pip"}
        />
      ))}
    </div>
  );
}

function StageTag({
  icon,
  label,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
        accent
          ? "border-[#f6d29c66] bg-[#f6d29c15] text-[#fff0cf]"
          : "border-[#f6d29c33] bg-[#120d09b8] text-[#e0c79f]"
      }`}
    >
      {icon}
      {label}
    </div>
  );
}

function StageMetric({
  label,
  value,
  detail,
  tone = 0,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: number;
}) {
  return (
    <div className="rounded-[24px] border border-[#f6d29c22] bg-[#160d0a] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#cfb28a]">
        {label}
      </div>
      <div className={`mt-2 text-xl font-semibold ${tone !== 0 ? deltaClass(tone) : "text-[#fff1d8]"}`}>
        {value}
      </div>
      <div className="mt-1 text-xs leading-5 text-[#a9906f]">{detail}</div>
    </div>
  );
}

function InsetMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-[#f6d29c22] bg-[#120c08] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ab936d]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#fff1d8]">{value}</div>
    </div>
  );
}

function PlayerFinanceStrip({
  player,
  isActive,
  deltas,
}: {
  player: Player;
  isActive: boolean;
  deltas: { cashDelta: number; netWorthDelta: number; boardDelta: number };
}) {
  const role = roleBadge(player);
  return (
    <div
      className={`rounded-[26px] border px-4 py-3 transition ${
        isActive
          ? "border-[#f6d29c66] bg-[linear-gradient(90deg,rgba(52,31,18,0.96),rgba(26,16,10,0.96))]"
          : "border-[#f6d29c22] bg-[#18100c]"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`h-12 w-12 rounded-full border-2 bg-cover bg-center ${
              isActive ? "piece-pulse" : ""
            }`}
            style={{ ...portraitStyle(player.id), borderColor: player.color }}
          />
          <div>
            <div className="text-lg font-semibold text-[#fff1d8]">{player.name}</div>
            <div
              className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${role.className}`}
            >
              {role.icon}
              {role.label}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <FinanceStat label="Cash" value={currency(player.cash)} />
          <FinanceStat label="Board value" value={currency(boardValue(player))} />
          <FinanceStat label="Net worth" value={currency(player.net_worth)} />
          <FinanceStat
            label="Cash pop"
            value={shortCurrency(deltas.cashDelta)}
            tone={deltas.cashDelta}
          />
          <FinanceStat
            label="Board pop"
            value={shortCurrency(deltas.boardDelta)}
            tone={deltas.boardDelta}
          />
        </div>
      </div>
    </div>
  );
}

function CompactFinanceCard({
  player,
  isActive,
  deltas,
}: {
  player: Player;
  isActive: boolean;
  deltas: { cashDelta: number; netWorthDelta: number; boardDelta: number };
}) {
  return (
    <div
      className={`rounded-[18px] border px-3 py-3 ${
        isActive
          ? "border-[#f6d29c66] bg-[#2c1a0f]"
          : "border-[#f6d29c20] bg-[#110b08]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="grid h-9 w-9 place-items-center rounded-full border-2 text-sm font-semibold text-[#100a07]"
            style={{ backgroundColor: player.color, borderColor: "#f8dfb7" }}
          >
            {tokenInitial(player)}
          </span>
          <div>
            <div className="text-sm font-semibold text-[#fff1d8]">{boardModelLabel(player)}</div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#bda17c]">
              {trainingLevel(player)}
            </div>
          </div>
        </div>
        <div className="text-right text-sm font-semibold text-[#fff1d8]">
          {currency(player.cash)}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <FinanceStat label="Cash" value={shortCurrency(deltas.cashDelta)} tone={deltas.cashDelta} />
        <FinanceStat label="Board" value={shortCurrency(deltas.boardDelta)} tone={deltas.boardDelta} />
        <FinanceStat label="Net" value={shortCurrency(deltas.netWorthDelta)} tone={deltas.netWorthDelta} />
      </div>
    </div>
  );
}

function FinanceStat({
  label,
  value,
  tone = 0,
}: {
  label: string;
  value: string;
  tone?: number;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-[#f6d29c1d] bg-[#100a07] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ae9572]">
        {label}
      </div>
      <div className={`mt-1 text-sm font-semibold ${tone !== 0 ? deltaClass(tone) : "text-[#fff1d8]"}`}>
        {value}
      </div>
    </div>
  );
}

function RankedAgentCard({
  player,
  rank,
  rankDelta,
  active,
  deltas,
}: {
  player: Player;
  rank: number;
  rankDelta: number;
  active: boolean;
  deltas: { cashDelta: number; netWorthDelta: number; boardDelta: number };
}) {
  const role = roleBadge(player);
  const rankLabel =
    rankDelta > 0 ? `UP ${rankDelta}` : rankDelta < 0 ? `DOWN ${Math.abs(rankDelta)}` : "HOLD";
  return (
    <div
      className={`rank-card rounded-[20px] border p-3 transition ${
        active
          ? "border-[#f6d29c77] bg-[linear-gradient(135deg,#3a2415,#170e09)]"
          : "border-[#f6d29c24] bg-[#170f0b]"
      }`}
    >
      <div className="grid grid-cols-[46px_72px_1fr] gap-3">
        <div className="grid content-start justify-items-center gap-2">
          <div className="grid h-11 w-11 place-items-center rounded-full border border-[#f6d29c55] bg-[#100a07] text-lg font-black text-[#fff1d8]">
            #{rank}
          </div>
          <div
            className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
              rankDelta > 0
                ? "bg-[#064e3b] text-[#a7f3d0]"
                : rankDelta < 0
                  ? "bg-[#5b1515] text-[#fecaca]"
                  : "bg-[#2a1a0f] text-[#d6bb93]"
            }`}
          >
            {rankLabel}
          </div>
        </div>

        <div
          className={`h-[96px] rounded-[16px] border bg-cover bg-center ${
            active ? "piece-pulse border-[#f6d29c77]" : "border-[#ffffff12]"
          }`}
          style={portraitStyle(player.id)}
        />

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xl font-semibold leading-none text-[#fff1d8]">
                {player.name}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#cdb28b]">
                {modelName(player)}
              </div>
            </div>
            <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${role.className}`}>
              {role.icon}
              {role.label}
            </div>
          </div>

          <div className="mt-2 rounded-[14px] border border-[#f6d29c20] bg-[#100a07] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d6bb93]">
            {trainingLevel(player)}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <HudMoney label="Cash in hand" value={currency(player.cash)} tone={deltas.cashDelta} />
            <HudMoney label="Total net worth" value={currency(player.net_worth)} tone={deltas.netWorthDelta} />
            <HudMoney label="Board value" value={currency(boardValue(player))} tone={deltas.boardDelta} />
            <HudMoney label="Owned spaces" value={String(player.owned_tiles.length)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function HudMoney({
  label,
  value,
  tone = 0,
}: {
  label: string;
  value: string;
  tone?: number;
}) {
  return (
    <div className="rounded-[14px] bg-[#0f0906] px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#9f8666]">
        {label}
      </div>
      <div className={`mt-1 text-base font-black ${tone !== 0 ? deltaClass(tone) : "text-[#fff1d8]"}`}>
        {value}
      </div>
    </div>
  );
}

function HudStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#120c08] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ab936d]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#fff1d8]">{value}</div>
    </div>
  );
}

function MiniMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] bg-[#1a110c] px-3 py-2">
      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#ab936d]">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-[#fff1d8]">{value}</div>
    </div>
  );
}

function DeckCard({
  title,
  active,
  reveal,
}: {
  title: string;
  active: boolean;
  reveal: string | null;
}) {
  const isChance = title === "Chance";
  return (
    <div
      className={`deck-stage rounded-[18px] border p-4 shadow-[0_16px_40px_rgba(0,0,0,0.32)] ${
        active
          ? "deck-flip border-[#f6d29c77] bg-[linear-gradient(180deg,#f7edd8,#d9b374)] text-[#24150c]"
          : "border-[#f6d29c22] bg-[linear-gradient(180deg,#21140c,#140c08)] text-[#f6e4c2]"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[11px] font-black uppercase tracking-[0.18em]">
          {title} deck
        </div>
        <div className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${
          active ? "bg-[#24150c] text-[#f7edd8]" : "bg-[#f6d29c12] text-[#d6bb93]"
        }`}>
          {active ? "drawn" : "armed"}
        </div>
      </div>

      <div className="relative mt-4 min-h-[126px]">
        <div className={`deck-stack ${isChance ? "deck-stack-chance" : "deck-stack-community"} ${active ? "deck-stack-active" : ""}`}>
          <div className="deck-card-back deck-card-back-3" />
          <div className="deck-card-back deck-card-back-2" />
          <div className="deck-card-back deck-card-back-1">
            <span>{isChance ? "?" : "C"}</span>
          </div>
        </div>
        <div className={`deck-reveal ${active ? "deck-reveal-active" : ""}`}>
          {reveal ? reveal : `${title} cards waiting in the well`}
        </div>
      </div>
    </div>
  );
}
