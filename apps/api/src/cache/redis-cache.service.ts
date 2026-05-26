import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisCacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name);
  private client: Redis | null = null;
  private isAvailable = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url =
      this.config.get<string>("REDIS_URL") ?? "redis://localhost:6379";

    this.client = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      retryStrategy: () => null,
      reconnectOnError: () => false,
    });

    this.client.on("ready", () => {
      this.isAvailable = true;
      this.logger.log("Redis connected");
    });
    this.client.on("close", () => {
      this.isAvailable = false;
    });
    this.client.on("error", (err) => {
      if (this.isAvailable) {
        this.logger.warn(`Redis error: ${err.message}`);
      }
    });

    this.client.connect().catch((err) => {
      this.isAvailable = false;
      this.logger.warn(
        `Redis unavailable at ${url}; cache disabled: ${err.message}`,
      );
      this.client?.disconnect();
    });
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isReady()) return null;

    try {
      const raw = await this.client!.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (!this.isReady()) return;

    try {
      await this.client!.set(key, JSON.stringify(value), "EX", ttlSeconds);
    } catch (err: any) {
      this.logger.warn(`Redis set failed [${key}]: ${err.message}`);
    }
  }

  async del(...keys: string[]): Promise<void> {
    if (!this.isReady()) return;

    try {
      if (keys.length > 0) await this.client!.del(...keys);
    } catch (err: any) {
      this.logger.warn(`Redis del failed: ${err.message}`);
    }
  }

  private isReady() {
    return this.isAvailable && this.client?.status === "ready";
  }
}
