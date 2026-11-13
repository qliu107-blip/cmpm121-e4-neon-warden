import Phaser from "phaser";
import { HEIGHT, WIDTH } from "./actors.ts";
import { Backdrop } from "./backdrop.ts";
import type { Hud } from "./hud.ts";
import type { LaunchOptions } from "./main.ts";
import { SECTORS, WARDEN } from "./route.ts";
import { loadSounds, play } from "./sounds.ts";
import { makeTextures, TINTS } from "./textures.ts";

/** Seconds of idling before the title hands the ship to the autopilot. */
const IDLE_SECONDS = 8;

/** Lines of the closing story and when (seconds) each appears. */
const STORY: [number, string][] = [
  [0.8, "The Warden's lights go dark, one ring at a time."],
  [4.2, "Behind you, five sectors of open sky."],
  [7.6, "Ahead, the long way home."],
];
const WARP_AT = 9;
const CREDITS_AT = 11;
const RETURN_AT = 18;

const FADE_COLOR = [4, 2, 12] as const;

export function fadeIn(scene: Phaser.Scene, duration = 400): void {
  scene.cameras.main.fadeIn(duration, ...FADE_COLOR);
}

export function fadeTo(scene: Phaser.Scene, next: string, data?: object): void {
  const camera = scene.cameras.main;
  camera.fadeOut(450, ...FADE_COLOR);
  camera.once("camerafadeoutcomplete", () => scene.scene.start(next, data));
}

export class TitleScene extends Phaser.Scene {
  static readonly KEY = "title";
  private backdrop!: Backdrop;
  private countdown!: Phaser.GameObjects.Text;
  private idle = 0;
  private leaving = false;

  constructor(
    private readonly hud: Hud,
    private readonly options: LaunchOptions,
  ) {
    super(TitleScene.KEY);
  }

  create(): void {
    this.idle = 0;
    this.leaving = false;
    if (!this.textures.exists("player")) {
      makeTextures(this);
      loadSounds(this);
    }
    this.backdrop = new Backdrop(this);
    this.input.keyboard?.on("keydown-SPACE", () => this.launch(false));
    this.hud.setMode("title");
    this.hud.setRoute([...SECTORS.map((sector) => sector.name), WARDEN.name]);
    this.hud.setSector(-1);
    this.hud.setBoss(null);
    this.hud.say("");

    const title = this.add.text(WIDTH / 2, HEIGHT * 0.34, "NEON\nWARDEN", {
      fontFamily: "Orbitron, Trebuchet MS, sans-serif",
      fontSize: "64px",
      fontStyle: "bold",
      align: "center",
      color: "#e8fdff",
    }).setOrigin(0.5).setLineSpacing(-6);
    title.enableFilters();
    title.filters?.internal.addGlow(0x5ef2ff, 6, 0, 1);
    this.tweens.add({
      targets: title,
      scale: 1.04,
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.add.text(WIDTH / 2, HEIGHT * 0.62, "SPACE  launch", {
      fontFamily: "monospace",
      fontSize: "20px",
      color: "#ffe066",
    }).setOrigin(0.5);
    this.countdown = this.add.text(WIDTH / 2, HEIGHT * 0.68, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#8aa4c8",
    }).setOrigin(0.5);

    fadeIn(this);
    if (this.options.attract) this.launch(true);
  }

  override update(_time: number, delta: number): void {
    this.backdrop.scroll(delta);
    if (this.leaving) return;
    this.idle += delta / 1000;
    const left = Math.ceil(IDLE_SECONDS - this.idle);
    this.countdown.setText(`self-play demo in ${left}`);
    if (left <= 0) this.launch(true);
  }

  private launch(demo: boolean): void {
    if (this.leaving) return;
    this.leaving = true;
    fadeTo(this, "play", { demo });
  }
}

interface CutsceneData {
  run: { score: number; kills: number; hits: number; continues: number };
  demo: boolean;
}

export class CutsceneScene extends Phaser.Scene {
  static readonly KEY = "cutscene";
  private backdrop!: Backdrop;
  private leaving = false;
  private dataForRun!: CutsceneData;

  constructor(private readonly hud: Hud) {
    super(CutsceneScene.KEY);
  }

  init(data: CutsceneData): void {
    this.dataForRun = data;
    this.leaving = false;
  }

  create(): void {
    this.backdrop = new Backdrop(this);
    this.input.keyboard?.on("keydown-SPACE", () => this.endCutscene());
    const { run, demo } = this.dataForRun;
    this.hud.setMode("cutscene");
    this.hud.setBoss(null);
    fadeIn(this, 600);

    const ship = this.add.image(WIDTH / 2, HEIGHT - 120, "player");
    ship.enableFilters();
    ship.filters?.internal.addGlow(TINTS.player, 5, 0, 1);
    this.add.particles(0, 0, "spark", {
      speedY: { min: 120, max: 260 },
      lifespan: 420,
      scale: { start: 1.2, end: 0 },
      tint: TINTS.player,
      blendMode: "ADD",
      frequency: 16,
    }).startFollow(ship, 0, 18);
    this.tweens.add({
      targets: ship,
      y: HEIGHT - 140,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    for (const [at, line] of STORY) {
      this.time.delayedCall(at * 1000, () => this.hud.say(line));
    }
    this.time.delayedCall(WARP_AT * 1000, () => {
      this.hud.say("");
      play(this, "pickup", 0.7);
      this.tweens.add({
        targets: this.backdrop,
        warp: 18,
        duration: 900,
        ease: "Quad.in",
      });
      this.tweens.killTweensOf(ship);
      this.tweens.add({
        targets: ship,
        y: -80,
        scale: 0.4,
        duration: 1100,
        ease: "Back.in",
      });
      this.time.delayedCall(
        1000,
        () => this.cameras.main.flash(500, 220, 250, 255),
      );
    });
    this.time.delayedCall(CREDITS_AT * 1000, () => {
      this.hud.announce("THANK YOU FOR PLAYING", `Final score ${run.score}`);
      if (demo) {
        this.hud.say(
          `Self-play: ${run.kills} kills, ${run.hits} hits, ${run.continues} continues`,
        );
      }
    });
    this.time.delayedCall(RETURN_AT * 1000, () => this.endCutscene());
  }

  override update(_time: number, delta: number): void {
    this.backdrop.scroll(delta);
  }

  private endCutscene(): void {
    if (this.leaving) return;
    this.leaving = true;
    this.hud.say("");
    fadeTo(this, TitleScene.KEY);
  }
}
