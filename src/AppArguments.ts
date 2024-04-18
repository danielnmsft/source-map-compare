import * as SMETypes from 'source-map-explorer/lib/types';

export type BundleStats = { results: SMETypes.ExploreBundleResult[] };

/**
 * Defines the boundary between the node.js-based CLI and the browser-based web page
 */
export type AppArguments =
  | {
      mode: 'comparison';
      leftBundles: SMETypes.ExploreBundleResult[];
      rightBundles: SMETypes.ExploreBundleResult[];
    }
  | {
      mode: 'single';
      bundle: SMETypes.ExploreBundleResult;
    };
