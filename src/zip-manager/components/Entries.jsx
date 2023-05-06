/* global setTimeout, clearTimeout */

import "./styles/Entries.css";

import { useEffect, useRef, useState } from "react";

function Entries({
  entries,
  selectedFolder,
  highlightedIds,
  deltaEntriesHeight,
  entriesElementHeight,
  hiddenDownloadManager,
  onDropFiles,
  onHighlight,
  onToggle,
  onToggleRange,
  onEnter,
  onUpdateEntriesHeight,
  onUpdateEntriesElementHeight,
  onRegisterResizeEntriesHandler,
  entriesRef,
  highlightedEntryRef,
  i18nService,
  constants,
  messages
}) {
  const [selectModeEnabled, setSelectModeEnabled] = useState(false);
  const [draggingItems, setDraggingItems] = useState(false);
  const touchEndTimeout = useRef(null);
  const previousTouchClientX = useRef(0);
  const previousTouchClientY = useRef(0);

  function getEntryClassName(entry) {
    const classes = [];
    if (entry.directory) {
      classes.push("directory");
    }
    if (highlightedIds.includes(entry.id)) {
      classes.push("entry-highlighted");
    }
    return classes.join(" ");
  }

  function handleKeyDown(event) {
    if (event.key !== constants.TAB_KEY) {
      event.preventDefault();
    }
  }

  function getEntriesStyle() {
    if (!hiddenDownloadManager && entriesElementHeight) {
      return { height: entriesElementHeight + deltaEntriesHeight + "px" };
    }
  }

  function setTouchEndEventTimeout() {
    clearTouchEndEventTimeout();
    touchEndTimeout.current = setTimeout(() => {
      touchEndTimeout.current = null;
      setSelectModeEnabled(!selectModeEnabled);
    }, constants.LONG_TOUCH_DELAY);
  }

  function clearTouchEndEventTimeout() {
    if (touchEndTimeout.current) {
      clearTimeout(touchEndTimeout.current);
      touchEndTimeout.current = null;
    }
  }

  function handleTouchMove(event) {
    const { clientX, clientY } = event.changedTouches[0];
    if (previousTouchClientY.current && previousTouchClientX.current) {
      const deltaY = Math.abs(clientY - previousTouchClientY.current);
      const deltaX = Math.abs(clientX - previousTouchClientX.current);
      if (deltaX > 1 && deltaY > 1) {
        clearTouchEndEventTimeout();
      }
    } else {
      previousTouchClientX.current = clientX;
      previousTouchClientY.current = clientY;
    }
  }

  function handleTouchEnd() {
    previousTouchClientX.current = 0;
    previousTouchClientY.current = 0;
    clearTouchEndEventTimeout();
  }

  function handleContextMenu(event) {
    event.preventDefault();
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDraggingItems(draggingItems);
    if (event.dataTransfer.items) {
      setDraggingItems(true);
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    setDraggingItems(false);
  }

  async function handleDrop(event) {
    if (event.dataTransfer.items) {
      event.preventDefault();
      setDraggingItems(false);
      onDropFiles(event.dataTransfer.items);
    }
  }

  function getEntriesClassName() {
    const classes = ["entries"];
    if (draggingItems) {
      classes.push("dragging-items");
    }
    return classes.join(" ");
  }

  useEffect(onUpdateEntriesHeight);
  useEffect(onRegisterResizeEntriesHandler);
  useEffect(onUpdateEntriesElementHeight, []);

  return (
    <div
      className={getEntriesClassName()}
      aria-label="Folder entries"
      role="navigation"
      ref={entriesRef}
      style={getEntriesStyle()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ol
        onKeyDown={handleKeyDown}
        onTouchStart={setTouchEndEventTimeout}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={handleContextMenu}
      >
        {entries.map((entry) => {
          if (highlightedIds.includes(entry.id)) {
            return (
              <li
                key={entry.id}
                ref={
                  highlightedIds[highlightedIds.length - 1] === entry.id
                    ? highlightedEntryRef
                    : null
                }
                className={getEntryClassName(entry)}
                tabIndex={0}
              >
                <Entry
                  entry={entry}
                  selectedFolder={selectedFolder}
                  highlighted={true}
                  selectModeEnabled={selectModeEnabled}
                  onHighlight={onHighlight}
                  onToggle={onToggle}
                  onToggleRange={onToggleRange}
                  onEnter={onEnter}
                  i18nService={i18nService}
                  messages={messages}
                />
              </li>
            );
          } else {
            return (
              <li key={entry.id} className={getEntryClassName(entry)}>
                <Entry
                  entry={entry}
                  selectedFolder={selectedFolder}
                  highlighted={false}
                  selectModeEnabled={selectModeEnabled}
                  onHighlight={onHighlight}
                  onToggle={onToggle}
                  onToggleRange={onToggleRange}
                  onEnter={onEnter}
                  i18nService={i18nService}
                  messages={messages}
                />
              </li>
            );
          }
        })}
      </ol>
    </div>
  );
}

function Entry({
  entry,
  selectedFolder,
  highlighted,
  selectModeEnabled,
  onHighlight,
  onToggle,
  onToggleRange,
  onEnter,
  i18nService,
  messages
}) {
  function onHighlightEntry() {
    selectModeEnabled ? onToggle(entry) : onHighlight(entry);
  }

  return (
    <>
      {selectModeEnabled && (
        <input
          className="entry-select"
          type="checkbox"
          checked={highlighted}
          onChange={() => onToggle(entry)}
        />
      )}
      <EntryName
        entry={entry}
        selectedFolder={selectedFolder}
        selectModeEnabled={selectModeEnabled}
        onHighlight={onHighlightEntry}
        onToggle={onToggle}
        onToggleRange={onToggleRange}
        onEnter={onEnter}
        i18nService={i18nService}
        messages={messages}
      />
      <EntryButton
        entry={entry}
        selectedFolder={selectedFolder}
        onEnter={onEnter}
        messages={messages}
      />
    </>
  );
}

function EntryName({
  entry,
  selectedFolder,
  selectModeEnabled,
  onHighlight,
  onToggle,
  onToggleRange,
  onEnter,
  i18nService,
  messages
}) {
  const {
    PARENT_FOLDER_TOOLTIP,
    LAST_MOD_DATE_LABEL,
    SIZE_LABEL,
    COMPRESSED_SIZE_LABEL,
    UNCOMPRESSED_SIZE_LABEL
  } = messages;
  const entryIsParentFolder = entry === selectedFolder.parent;

  function getEntryNameTitle() {
    const tooltip = [entryIsParentFolder ? PARENT_FOLDER_TOOLTIP : entry.name];
    if (entry.data) {
      const { compressedSize, lastModified, lastModDate, size } = entry.data;
      const uncompressedSize = size || entry.data.uncompressedSize;
      tooltip.push(
        LAST_MOD_DATE_LABEL +
          " " +
          i18nService.formatDate(
            lastModified === undefined ? lastModDate : new Date(lastModified)
          )
      );
      if (uncompressedSize && compressedSize) {
        tooltip.push(
          COMPRESSED_SIZE_LABEL + " " + i18nService.formatSize(compressedSize)
        );
      }
      if (uncompressedSize) {
        tooltip.push(
          (compressedSize ? UNCOMPRESSED_SIZE_LABEL : SIZE_LABEL) +
            " " +
            i18nService.formatSize(uncompressedSize)
        );
      }
    }
    return tooltip.join("\n");
  }

  function handleClick(event) {
    if (event.metaKey) {
      onToggle(entry);
    } else if (event.shiftKey) {
      onToggleRange(entry);
    } else {
      onHighlight(entry);
    }
  }

  function handleDoubleClick(event) {
    if (!selectModeEnabled && !event.metaKey) {
      onEnter(entry);
    }
  }

  return (
    <span
      className="entry-name"
      title={getEntryNameTitle()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <span className="list-item-name">
        {entryIsParentFolder ? messages.PARENT_FOLDER_LABEL : entry.name}
      </span>
    </span>
  );
}

function EntryButton({ entry, selectedFolder, onEnter, messages }) {
  function getEntryButtonTitle() {
    const keys = [messages.SPACE_KEY_LABEL];
    if (entry === selectedFolder.parent) {
      keys.push(messages.ARROW_LEFT_KEY_LABEL);
    } else if (entry.directory) {
      keys.push(messages.ARROW_RIGHT_KEY_LABEL);
    }
    return messages.SHORTCUT_LABEL + keys.join(messages.KEYS_SEPARATOR_LABEL);
  }

  function handleClick() {
    onEnter(entry);
  }

  return (
    <span
      className="list-item-button"
      onClick={handleClick}
      title={getEntryButtonTitle()}
    >
      {entry.directory
        ? messages.DOWNLOAD_BUTTON_LABEL
        : messages.ENTER_FOLDER_BUTTON_LABEL}
    </span>
  );
}

export default Entries;
