import * as SMETypes from 'source-map-explorer/lib/types';
import { isTruthy } from '../Helpers/TypeUtils';
import { DescendantInfoPredicate, ListItem } from './FileList';
import { FileTree, makeFileTree, reduceFileTree } from './FileTree';

export type SizeFileTree = FileTree<SMETypes.FileData, SMETypes.FileData>;

export function makeFileTreeFromSingleBundle(bundleInfo: SMETypes.ExploreBundleResult): SizeFileTree {
  return reduceFileTree<SMETypes.FileData, unknown, SMETypes.FileData>(
    makeFileTree(bundleInfo.files),
    // Reducer to add up cumulative size of sub-tree
    (files, subdirectories): SMETypes.FileData =>
      // eslint-disable-next-line no-restricted-syntax
      [...Object.values(files), ...Object.values(subdirectories)]
        .filter(isTruthy)
        .reduce<SMETypes.FileData>((prev, next) => ({ size: prev.size + next.meta.size }), { size: 0 })
  );
}

export type DescendantSizeInfo = { ratioOfParent: number; ratioOfTotal: number };

export const makeDescendantInfoForSizeFileTree: DescendantInfoPredicate<
  SMETypes.FileData,
  SMETypes.FileData,
  DescendantSizeInfo
> = (curr, parent, root) => ({
  ratioOfParent: curr.meta.size / (parent?.meta.size ?? curr.meta.size),
  ratioOfTotal: curr.meta.size / root.meta.size
});

export type SizeListItem = ListItem<SMETypes.FileData, SMETypes.FileData, DescendantSizeInfo>;
