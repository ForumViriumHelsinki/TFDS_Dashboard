import { describe, it, expect, vi, afterEach } from "vitest";
import type { Feature, Geometry } from "geojson";
import {
  getAirQualityStationName,
  type AirQualityProps,
} from "../src/utils/airQuality";
import {
  AirQualityResponseError,
  AirQualityTypes,
  fetchAirQuality,
  getListAirQualityQueryOptions,
} from "../src/queries/air-quality";

function makeFeature(
  properties: AirQualityProps,
): Feature<Geometry, AirQualityProps> {
  return {
    type: "Feature",
    geometry: { type: "Point", coordinates: [0, 0] },
    properties,
  };
}

function mockFetch(
  response: Partial<Response> & { text: () => Promise<string> },
) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => response as unknown as Response),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getAirQualityStationName", () => {
  it("prefers Nimi (24h_maksimiarvo layer)", () => {
    const feature = makeFeature({ Nimi: "Kallio", Mittausasema: "Other" });
    expect(getAirQualityStationName(feature)).toBe("Kallio");
  });

  it("falls back to Mittausasema (Ilmanlaatu_nyt layer)", () => {
    const feature = makeFeature({ Mittausasema: "Mannerheimintie" });
    expect(getAirQualityStationName(feature)).toBe("Mannerheimintie");
  });

  it("returns an empty string when neither field is present", () => {
    expect(getAirQualityStationName(makeFeature({}))).toBe("");
    expect(getAirQualityStationName(undefined)).toBe("");
    expect(getAirQualityStationName({ properties: null })).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(getAirQualityStationName(makeFeature({ Nimi: "  Tapiola  " }))).toBe(
      "Tapiola",
    );
  });
});

describe("fetchAirQuality", () => {
  it("returns the FeatureCollection on a valid response", async () => {
    const collection = {
      type: "FeatureCollection",
      features: [makeFeature({ Nimi: "Kallio" })],
    };
    mockFetch({ ok: true, text: async () => JSON.stringify(collection) });

    const data = await fetchAirQuality(AirQualityTypes.AIR_QUALITY_NOW);
    expect(data.features).toHaveLength(1);
    expect(getAirQualityStationName(data.features[0])).toBe("Kallio");
  });

  it("throws a descriptive error when the response is not ok", async () => {
    mockFetch({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      text: async () => "",
    });

    await expect(
      fetchAirQuality(AirQualityTypes.AIR_QUALITY_NOW),
    ).rejects.toThrow(/502 Bad Gateway/);
  });

  it("throws AirQualityResponseError on a truncated / non-JSON body", async () => {
    mockFetch({
      ok: true,
      // A truncated JSON payload (e.g. a partially filled nginx cache).
      text: async () => '{"type":"FeatureColl',
    });

    await expect(
      fetchAirQuality(AirQualityTypes.AIR_QUALITY_NOW),
    ).rejects.toBeInstanceOf(AirQualityResponseError);
  });

  it("throws AirQualityResponseError on an OGC ExceptionReport (XML)", async () => {
    mockFetch({
      ok: true,
      text: async () =>
        '<?xml version="1.0"?><ows:ExceptionReport>boom</ows:ExceptionReport>',
    });

    await expect(
      fetchAirQuality(AirQualityTypes.AIR_QUALITY_NOW),
    ).rejects.toBeInstanceOf(AirQualityResponseError);
  });

  it("throws AirQualityResponseError when JSON is not a FeatureCollection", async () => {
    mockFetch({
      ok: true,
      text: async () => JSON.stringify({ type: "Feature", features: null }),
    });

    await expect(
      fetchAirQuality(AirQualityTypes.AIR_QUALITY_NOW),
    ).rejects.toBeInstanceOf(AirQualityResponseError);
  });
});

describe("getListAirQualityQueryOptions", () => {
  it("configures a bounded retry for transient failures", () => {
    const options = getListAirQualityQueryOptions({
      airQualityType: AirQualityTypes.AIR_QUALITY_24H_MAX,
    });
    expect(options.retry).toBe(2);
    expect(typeof options.retryDelay).toBe("function");
  });
});
