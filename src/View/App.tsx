import { DetailsList } from '@fluentui/react';
import * as React from 'react';
import * as SMETypes from 'source-map-explorer/lib/types';
import * as SafeHooks from '../Helpers/SafeHooks';
import {
  ComparisonListItem,
  makeComparisonFileTree,
  makeDescendantInfoForComparisonFileTree
} from '../Model/BundleComparison';
import { ExpandState, ListItem, makeListFromFileTree } from '../Model/FileList';
import { makeDescendantInfoForSizeFileTree, makeFileTreeFromSingleBundle, SizeListItem } from '../Model/SingleBundle';
import { bundleComparisonColumns, singleBundleColumns } from './Columns';

// Expands / collapses list item
const makeOnItemInvokedHandler = (expandState: ExpandState, setExpandState: (newState: ExpandState) => void) => (
  item: SizeListItem
) => {
  if (item.isDirectory) {
    setExpandState({ ...expandState, [item.nodeId]: !expandState[item.nodeId] });
  }
};

const getListItemKey = (item: ListItem<unknown, unknown, unknown>): string => String(item.nodeId);

export interface SingleBundleAppProps {
  exploredBundle: SMETypes.ExploreBundleResult;
}

export const SingleBundleApp: React.FC<SingleBundleAppProps> = props => {
  const [expandState, setExpandState] = React.useState<ExpandState>({});
  const fileTree = SafeHooks.useMemo(makeFileTreeFromSingleBundle, props.exploredBundle);
  const listItems = SafeHooks.useMemo(
    makeListFromFileTree,
    fileTree,
    expandState,
    makeDescendantInfoForSizeFileTree
  ) as SizeListItem[];
  const onItemInvoked = SafeHooks.useMemo(makeOnItemInvokedHandler, expandState, setExpandState);

  return (
    <DetailsList
      items={listItems}
      columns={singleBundleColumns}
      onItemInvoked={onItemInvoked}
      useReducedRowRenderer={true}
      getKey={getListItemKey}
    />
  );
};

export interface BundleComparisonAppProps {
  leftBundles: SMETypes.ExploreBundleResult[];
  rightBundles: SMETypes.ExploreBundleResult[];
}

export const BundleComparisonApp: React.FC<BundleComparisonAppProps> = props => {
  const [expandState, setExpandState] = React.useState<ExpandState>({});
  const fileTree = SafeHooks.useMemo(makeComparisonFileTree, props.leftBundles, props.rightBundles);
  const listItems = SafeHooks.useMemo(
    makeListFromFileTree,
    fileTree,
    expandState,
    makeDescendantInfoForComparisonFileTree
  ) as ComparisonListItem[];
  const onItemInvoked = SafeHooks.useMemo(makeOnItemInvokedHandler, expandState, setExpandState);

  return (
    <DetailsList
      items={listItems}
      columns={bundleComparisonColumns}
      onItemInvoked={onItemInvoked}
      useReducedRowRenderer={true}
      getKey={getListItemKey}
    />
  );
};
