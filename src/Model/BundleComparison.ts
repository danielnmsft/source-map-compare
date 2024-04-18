import path from 'path';
import * as SMETypes from 'source-map-explorer/lib/types';
import { isTruthy } from '../Helpers/TypeUtils';
import { DescendantInfoPredicate, ListItem } from './FileList';
import { FileTree, makeFileTree, reduceFileTree } from './FileTree';

export interface BundleMetadata {
  bundleNames: string[];
  size: number;
}

export interface ComparisonMetadata {
  left: BundleMetadata;
  right: BundleMetadata;
}

export type ComparisonFileTree = FileTree<ComparisonMetadata, ComparisonMetadata>;

function normalizeFilepath(filepath: string) {
  if (!URL.canParse(filepath)) {
    return filepath;
  }
  const uri = new URL(filepath);
  return path.posix.normalize(uri.pathname).replace(/.+[/\\]node_modules[/\\]/, '//node_modules/');
}

export function makeComparisonFileTree(
  leftBundles: SMETypes.ExploreBundleResult[],
  rightBundles: SMETypes.ExploreBundleResult[]
): ComparisonFileTree {
  // merge contents
  const diffMap = new Map<string, ComparisonMetadata>();

  for (const { bundleName, files } of leftBundles) {
    for (const [filepath, data] of Object.entries(files)) {
      diffMap.set(normalizeFilepath(filepath), {
        left: { size: data.size, bundleNames: [bundleName] },
        right: { size: 0, bundleNames: [] }
      });
    }
  }

  for (const { bundleName, files } of rightBundles) {
    for (const [filepath, data] of Object.entries(files)) {
      const normalizedFilePath = normalizeFilepath(filepath);
      const leftValue = diffMap.get(normalizedFilePath);
      if (leftValue) {
        leftValue.right = { size: data.size, bundleNames: [bundleName] };
      } else {
        diffMap.set(normalizedFilePath, {
          left: { size: 0, bundleNames: [] },
          right: { size: data.size, bundleNames: [bundleName] }
        });
      }
    }
  }

  return reduceFileTree<ComparisonMetadata, unknown, ComparisonMetadata>(
    makeFileTree(Object.fromEntries(diffMap.entries())),
    // Reducer to add up cumulative size of sub-tree
    (files, subdirectories): ComparisonMetadata =>
      // eslint-disable-next-line no-restricted-syntax
      [...Object.values(files), ...Object.values(subdirectories)].filter(isTruthy).reduce<ComparisonMetadata>(
        (prev, next) => ({
          left: {
            size: prev.left.size + next.meta.left.size,
            bundleNames: [...new Set(prev.left.bundleNames.concat(next.meta.left.bundleNames))]
          },
          right: {
            size: prev.right.size + next.meta.right.size,
            bundleNames: [...new Set(prev.right.bundleNames.concat(next.meta.right.bundleNames))]
          }
        }),
        { left: { size: 0, bundleNames: [] }, right: { size: 0, bundleNames: [] } }
      )
  );
}

export type DescendantComparisonInfo = { ratioChangeOfTotal: number };

export const makeDescendantInfoForComparisonFileTree: DescendantInfoPredicate<
  ComparisonMetadata,
  ComparisonMetadata,
  DescendantComparisonInfo
> = (curr, _parent, root) => ({
  ratioChangeOfTotal: (curr.meta.right.size - curr.meta.left.size) / (root.meta.right.size - root.meta.left.size)
});

export type ComparisonListItem = ListItem<ComparisonMetadata, ComparisonMetadata, DescendantComparisonInfo>;
