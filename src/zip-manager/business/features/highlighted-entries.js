function getHighlightedEntriesFeatures({
  zipFilesystem,
  entries,
  history,
  historyIndex,
  highlightedIds,
  selectedFolder,
  clipboardData,
  setHistory,
  setHistoryIndex,
  setClipboardData,
  setHighlightedIds,
  setPreviousHighlight,
  setExtractDialog,
  setRenameDialog,
  setDeleteEntryDialog,
  removeDownload,
  updateSelectedFolder,
  downloadFile,
  openDisplayError,
  constants
}) {
  const { DEFAULT_MIME_TYPE } = constants;

  function copy() {
    setClipboardData({
      entries: highlightedIds.map((entryId) =>
        zipFilesystem.getById(entryId).clone(true)
      )
    });
  }

  function cut() {
    setClipboardData({
      entries: highlightedIds.map((entryId) => zipFilesystem.getById(entryId)),
      cut: true
    });
  }

  function paste() {
    try {
      const { entries, cut } = clipboardData;
      if (cut) {
        entries.forEach((entry) => {
          zipFilesystem.move(entry, selectedFolder);
        });
      } else {
        const clones = entries.map((entry) => {
          let clone = entry.clone(true);
          zipFilesystem.move(entry, selectedFolder);
          return clone;
        });
        setClipboardData({ entries: clones });
      }
      setHighlightedIds(entries.map((entry) => entry.id));
      updateSelectedFolder();
    } catch (error) {
      openDisplayError(error.message);
    }
  }

  function openPromptRename() {
    const highlightedEntry = zipFilesystem.getById(highlightedIds[0]);
    setRenameDialog({
      filename: highlightedEntry.name
    });
  }

  function rename({ filename }) {
    try {
      const highlightedEntry = zipFilesystem.getById(highlightedIds[0]);
      if (filename !== highlightedEntry.name) {
        highlightedEntry.rename(filename);
        updateSelectedFolder();
      }
    } catch (error) {
      openDisplayError(error.message);
    }
  }
  function closePromptRename() {
    setRenameDialog(null);
  }

  function openConfirmDeleteEntry() {
    setDeleteEntryDialog({});
  }

  function deleteEntry() {
    highlightedIds.forEach((id) =>
      zipFilesystem.remove(zipFilesystem.getById(id))
    );
    if (selectedFolder.children.length) {
      const indexEntry = Math.max(
        ...entries
          .map((entry, index) => ({ entry, index }))
          .filter(({ entry }) => highlightedIds.includes(entry.id))
          .map(({ index }) => index)
      );
      let indexNextEntry = indexEntry;
      while (
        indexNextEntry < entries.length &&
        highlightedIds.includes(entries[indexNextEntry].id)
      ) {
        indexNextEntry++;
      }
      if (indexNextEntry === entries.length) {
        indexNextEntry = indexEntry;
        while (
          indexNextEntry >= 0 &&
          highlightedIds.includes(entries[indexNextEntry].id)
        ) {
          indexNextEntry--;
        }
      }
      setPreviousHighlight(entries[indexNextEntry]);
      setHighlightedIds([entries[indexNextEntry].id]);
    } else {
      setPreviousHighlight(null);
      setHighlightedIds([]);
    }
    updateHistoryData();
    updateSelectedFolder();
  }

  function closeConfirmDeleteEntry() {
    setDeleteEntryDialog(null);
  }

  function openPromptExtract(
    highlightedEntry = zipFilesystem.getById(highlightedIds[0])
  ) {
    setExtractDialog({
      filename: highlightedEntry.name
    });
  }

  function extract({ filename }) {
    async function download() {
      try {
        const highlightedEntry = zipFilesystem.getById(highlightedIds[0]);
        await downloadFile(filename, {}, async (download, options) => {
          try {
            return await highlightedEntry.getBlob(DEFAULT_MIME_TYPE, options);
          } finally {
            removeDownload(download);
          }
        });
      } catch (error) {
        openDisplayError(error.message);
      }
    }

    download();
  }

  function closePromptExtract() {
    setExtractDialog(null);
  }

  function updateHistoryData() {
    let offsetIndex = 0;
    let previousEntry;
    const highlightedEntry = entries.find(
      (entry) => entry.id === highlightedIds[0]
    );
    const newHistory = history.filter((entry, indexEntry) => {
      const entryRemoved =
        previousEntry === entry ||
        entry === highlightedEntry ||
        entry.isDescendantOf(highlightedEntry);
      if (entryRemoved) {
        if (indexEntry <= historyIndex) {
          offsetIndex++;
        }
      } else {
        previousEntry = entry;
      }
      return !entryRemoved;
    });
    const newHistoryIndex = historyIndex - offsetIndex;
    setHistory(newHistory);
    setHistoryIndex(newHistoryIndex);
  }

  return {
    copy,
    cut,
    paste,
    openPromptRename,
    rename,
    closePromptRename,
    openConfirmDeleteEntry,
    deleteEntry,
    closeConfirmDeleteEntry,
    openPromptExtract,
    extract,
    closePromptExtract
  };
}

export default getHighlightedEntriesFeatures;
