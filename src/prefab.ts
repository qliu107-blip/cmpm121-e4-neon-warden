import Phaser from "phaser";
import { Actor, type Arena, WIDTH } from "./actors.ts";

function aim(from: { x: number; y: number }, arena: Arena): number {
  return Math.atan2(arena.player.y - from.y, arena.player.x - from.x);
}

import type { EnemyKind } from "./route.ts";

interface PrefabKind {
  texture: EnemyKind | "boss";
  hp: number;
  score: number;
  radius: number;
  dropChance: number;
}

interface EnemyDefinition extends PrefabKind {
  move?: (enemy: ShmupEnemy, arena: Arena) => void;
  fire?: (enemy: ShmupEnemy, arena: Arena) => void;
}

export const ENEMIES = {
  drone: {
    texture: "drone",
    hp: 2,
    score: 100,
    radius: 13,
    dropChance: 0.015,
    move(enemy) {
      enemy.y += 1.5;
      enemy.x = enemy.homeX + Math.sin(enemy.age * 0.045) * 46 * enemy.side;
    },
    fire(enemy, arena) {
      if (enemy.age % 100 !== 60 || !arena.rng.chance(0.35)) return;
      arena.fire(enemy.x, enemy.y, aim(enemy, arena), 2.4);
    },
  },
  dart: {
    texture: "dart",
    hp: 1,
    score: 150,
    radius: 12,
    dropChance: 0.015,
    move(enemy, arena) {
      if (enemy.age < 50) {
        enemy.y += 1.2;
      } else {
        if (enemy.age === 50) {
          enemy.heading = Math.sign(arena.player.x - enemy.x) * 1.4;
        }
        enemy.y += 5.2;
        enemy.x += enemy.heading;
      }
    },
  },
  turret: {
    texture: "turret",
    hp: 12,
    score: 400,
    radius: 19,
    dropChance: 0.3,
    move(enemy) {
      if (enemy.age < 70) enemy.y += 1.6;
      else if (enemy.age > 420) enemy.y += 1.2;
      enemy.rotation += 0.02;
    },
    fire(enemy, arena) {
      const t = enemy.age - 80;
      if (t < 0 || enemy.age > 420 || t % 100 > 40 || t % 8 !== 0) return;
      arena.fire(enemy.x, enemy.y, aim(enemy, arena), 3.4);
    },
  },
  lancer: {
    texture: "lancer",
    hp: 4,
    score: 250,
    radius: 15,
    dropChance: 0.06,
    move(enemy) {
      enemy.x += 2.4 * enemy.side;
      enemy.y += 0.35;
    },
    fire(enemy, arena) {
      if (enemy.age % 40 !== 20 || enemy.x < 20 || enemy.x > WIDTH - 20) return;
      for (const spread of [-0.25, 0, 0.25]) {
        arena.fire(enemy.x, enemy.y + 8, Math.PI / 2 + spread, 2.6);
      }
    },
  },
} satisfies Record<EnemyKind, EnemyDefinition>;

const BOSS: PrefabKind = {
  texture: "boss",
  hp: 900,
  score: 10000,
  radius: 46,
  dropChance: 0,
};
export class ShmupEnemy extends Actor {
  readonly maxHp: number;
  readonly homeX: number;
  hp: number;
  private flash = 0;
  heading = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly definition: EnemyDefinition,
    x: number,
    y: number,
    readonly side = 1,
  ) {
    super(scene, x, y, definition.texture, definition.radius);
    this.hp = this.maxHp = definition.hp;
    this.homeX = x;
  }

  get score(): number {
    return this.definition.score;
  }

  get dropChance(): number {
    return this.definition.dropChance;
  }

  step(arena: Arena): void {
    this.age++;
    const { x, y } = this;
    this.definition.move?.(this, arena);
    this.vx = this.x - x;
    this.vy = this.y - y;
    this.definition.fire?.(this, arena);
    this.flash = Math.max(0, this.flash - 1);
    if (this.flash > 0) {
      this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    } else this.clearTint();
  }

  get fraction(): number {
    return this.hp / this.maxHp;
  }

  /** Returns true when this hit destroys the prefab. */
  takeDamage(amount: number): boolean {
    this.hp -= amount;
    this.flash = 3;
    return this.hp <= 0;
  }
}

/** The Warden: a three-phase finale whose attacks escalate as it weakens. */
export class ShmupBoss extends ShmupEnemy {
  private spin = 0;
  readonly core: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    super(scene, BOSS, WIDTH / 2, -90);
    this.core = scene.add.image(this.x, this.y, "boss-core").setBlendMode(
      Phaser.BlendModes.ADD,
    );
  }

  phase(): number {
    return this.fraction > 2 / 3 ? 1 : this.fraction > 1 / 3 ? 2 : 3;
  }

  /** The Warden ignores damage until it has finished descending. */
  get arrived(): boolean {
    return this.age > 150;
  }

  override takeDamage(amount: number): boolean {
    return this.arrived ? super.takeDamage(amount) : false;
  }

  override step(arena: Arena): void {
    super.step(arena);
    if (!this.arrived) {
      this.y += 1.4;
    } else {
      const sway = this.phase() === 3 ? 0.012 : 0.008;
      this.x = WIDTH / 2 + Math.sin((this.age - 150) * sway) * 140;
      this.attack(arena, this.age - 150);
    }
    this.core.setPosition(this.x, this.y + 6);
    this.core.setScale(1 + 0.15 * Math.sin(this.age * (0.08 * this.phase())));
  }

  private attack(arena: Arena, t: number): void {
    if (this.phase() === 1 && t % 55 === 0) this.fan(arena, 9, 1.1, 2.8);
    if (this.phase() === 2) {
      if (t % 80 === 0) this.fan(arena, 9, 1.2, 3);
      if (t % 80 === 40) {
        for (const d of [-0.12, 0, 0.12]) {
          arena.fire(this.x, this.y + 30, aim(this, arena) + d, 4.2, true);
        }
      }
      if (t % 360 === 180) {
        arena.summon("drone", this.x - 70, this.y);
        arena.summon("drone", this.x + 70, this.y);
      }
    }
    if (this.phase() === 3 && t % 6 === 0) {
      this.spin += 0.23;
      for (let arm = 0; arm < 4; arm++) {
        arena.fire(this.x, this.y + 6, this.spin + (arm * Math.PI) / 2, 2.6);
      }
      if (t % 48 === 0) {
        arena.fire(this.x, this.y + 30, aim(this, arena), 4.6, true);
      }
    }
  }

  private fan(arena: Arena, count: number, width: number, speed: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.PI / 2 + (i / (count - 1) - 0.5) * width;
      arena.fire(this.x, this.y + 40, angle, speed);
    }
  }

  override destroy(fromScene?: boolean): void {
    this.core.destroy(fromScene);
    super.destroy(fromScene);
  }
}

export class ShmupPowerUp extends Actor {
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly kind: "spread" | "shield",
  ) {
    super(scene, x, y, kind, 14);
  }

  step(): void {
    this.age++;
    this.y += 1.1;
    this.rotation += 0.04;
    this.setScale(1 + 0.12 * Math.sin(this.age * 0.15));
  }
}
