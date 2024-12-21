import { BaseFootballResponse, Fixture, Odd } from "../types/football";
import fetch from "node-fetch";

export class FootballApiService {
  private readonly baseUrl = "https://v3.football.api-sports.io";
  private readonly apiKey: string = process.env.FOOTBALL_API_KEY!;

  constructor() {}

  private async fetchApi<T>(
    endpoint: string,
    params: Record<string, string | number>
  ): Promise<BaseFootballResponse<T>> {
    const url = new URL(`${this.baseUrl}/${endpoint}`);

    Object.keys(params).forEach((key) =>
      url.searchParams.append(key, String(params[key]))
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-rapidapi-host": "v3.football.api-sports.io",
        "x-rapidapi-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API call failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json() as unknown as BaseFootballResponse<T>;
  }

  public getFixtures(params: {
    league?: string;
    season?: string;
    team?: string;
    next?: number;
  }): Promise<BaseFootballResponse<Fixture[]>> {
    return this.fetchApi<Fixture[]>("fixtures", params);
  }

  public getOdds(params: {
    fixture: string;
    league?: string;
    season?: string;
  }): Promise<BaseFootballResponse<Odd[]>> {
    return this.fetchApi<Odd[]>("odds", params);
  }
}
