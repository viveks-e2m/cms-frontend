export const STATUS_SUMMARY_KEYS = {
  open: "open_count",
  in_progress: "in_progress_count",
  completed: "completed_count",
};

export const adjustSummaryCounts = (summary, { decrementStatus, incrementStatus, totalDelta = 0 }) => {
  if (!summary) return summary;

  const updatedSummary = { ...summary };

  if (totalDelta !== 0) {
    updatedSummary.total_items = Math.max(
      0,
      (updatedSummary.total_items || 0) + totalDelta
    );
  }

  if (decrementStatus && STATUS_SUMMARY_KEYS[decrementStatus]) {
    const key = STATUS_SUMMARY_KEYS[decrementStatus];
    updatedSummary[key] = Math.max(0, (updatedSummary[key] || 0) - 1);
  }

  if (incrementStatus && STATUS_SUMMARY_KEYS[incrementStatus]) {
    const key = STATUS_SUMMARY_KEYS[incrementStatus];
    updatedSummary[key] = (updatedSummary[key] || 0) + 1;
  }

  return updatedSummary;
};

export const applyKanbanItemUpdate = (oldData, updatedItem, previousStatus) => {
  if (!oldData?.columns) {
    return oldData;
  }

  const nextStatus = updatedItem.status || previousStatus || "open";
  const updatedColumns = {};

  Object.entries(oldData.columns).forEach(([status, column]) => {
    let items = column.items || [];
    const containsItem = items.some((item) => item.id === updatedItem.id);

    if (status === previousStatus && previousStatus !== nextStatus) {
      items = items.filter((item) => item.id !== updatedItem.id);
    } else if (containsItem) {
      items = items.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      );
    }

    if (status === nextStatus) {
      const existingIndex = items.findIndex((item) => item.id === updatedItem.id);
      if (existingIndex >= 0) {
        items[existingIndex] = { ...items[existingIndex], ...updatedItem };
      } else {
        items = [{ ...updatedItem }, ...items];
      }
    }

    updatedColumns[status] = {
      ...column,
      items,
    };
  });

  if (previousStatus && previousStatus !== nextStatus && updatedColumns[previousStatus]) {
    updatedColumns[previousStatus] = {
      ...updatedColumns[previousStatus],
      pagination: updatedColumns[previousStatus].pagination
        ? {
            ...updatedColumns[previousStatus].pagination,
            total: Math.max(0, (updatedColumns[previousStatus].pagination.total || 0) - 1),
          }
        : updatedColumns[previousStatus].pagination,
    };
  }

  if (nextStatus && previousStatus !== nextStatus && updatedColumns[nextStatus]) {
    updatedColumns[nextStatus] = {
      ...updatedColumns[nextStatus],
      pagination: updatedColumns[nextStatus].pagination
        ? {
            ...updatedColumns[nextStatus].pagination,
            total: (updatedColumns[nextStatus].pagination.total || 0) + 1,
          }
        : updatedColumns[nextStatus].pagination,
    };
  }

  return {
    ...oldData,
    columns: updatedColumns,
    summary: adjustSummaryCounts(oldData.summary, {
      decrementStatus: previousStatus !== nextStatus ? previousStatus : null,
      incrementStatus: previousStatus !== nextStatus ? nextStatus : null,
    }),
  };
};

export const applyKanbanItemDeletion = (oldData, deletedItemId, deletedStatus) => {
  if (!oldData?.columns) {
    return oldData;
  }

  let resolvedStatus = deletedStatus;
  const updatedColumns = {};

  Object.entries(oldData.columns).forEach(([status, column]) => {
    const originalLength = column.items?.length || 0;
    const items = (column.items || []).filter((item) => item.id !== deletedItemId);

    if (originalLength !== items.length && !resolvedStatus) {
      resolvedStatus = status;
    }

    updatedColumns[status] = {
      ...column,
      items,
    };
  });

  if (resolvedStatus && updatedColumns[resolvedStatus]) {
    updatedColumns[resolvedStatus] = {
      ...updatedColumns[resolvedStatus],
      pagination: updatedColumns[resolvedStatus].pagination
        ? {
            ...updatedColumns[resolvedStatus].pagination,
            total: Math.max(0, (updatedColumns[resolvedStatus].pagination.total || 0) - 1),
          }
        : updatedColumns[resolvedStatus].pagination,
    };
  }

  return {
    ...oldData,
    columns: updatedColumns,
    summary: adjustSummaryCounts(oldData.summary, {
      decrementStatus: resolvedStatus || null,
      totalDelta: -1,
    }),
  };
};

