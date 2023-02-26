import "./styles/TopButtonBar.css";

import { useRef } from "react";

function TopButtonBar({
  addFilesButtonRef,
  importZipButtonRef,
  disabledExportZipButton,
  disabledResetButton,
  onCreateFolder,
  onAddFiles,
  onImportZipFile,
  onExportZipFile,
  onReset,
  constants,
  messages
}) {
  return (
    <div className="button-bar">
      <div className="button-group">
        <CreateFolderButton
          onCreateFolder={onCreateFolder}
          constants={constants}
          messages={messages}
        />
        <AddFilesButton
          onAddFiles={onAddFiles}
          addFilesButtonRef={addFilesButtonRef}
          constants={constants}
          messages={messages}
        />
      </div>
      <div className="button-group">
        <ImportZipButton
          onImportZipFile={onImportZipFile}
          importZipButtonRef={importZipButtonRef}
          constants={constants}
          messages={messages}
        />
        <ExportZipButton
          disabled={disabledExportZipButton}
          onExportZipFile={onExportZipFile}
          constants={constants}
          messages={messages}
        />
      </div>
      <div className="button-group">
        <ResetButton
          disabled={disabledResetButton}
          onReset={onReset}
          messages={messages}
        />
      </div>
    </div>
  );
}

function CreateFolderButton({ onCreateFolder, constants, messages }) {
  return (
    <button
      onClick={onCreateFolder}
      title={
        messages.SHORTCUT_LABEL +
        messages.CTRL_KEY_LABEL +
        constants.CREATE_FOLDER_KEY
      }
    >
      {messages.CREATE_FOLDER_BUTTON_LABEL}
    </button>
  );
}

function AddFilesButton({
  addFilesButtonRef,
  onAddFiles,
  constants,
  messages
}) {
  const fileInputRef = useRef(null);
  const { current } = fileInputRef;

  function handleChange({ target }) {
    const files = Array.from(target.files);
    current.value = "";
    if (files.length) {
      onAddFiles(files);
    }
  }

  function handleClick() {
    current.click();
  }

  return (
    <>
      <button
        onClick={handleClick}
        ref={addFilesButtonRef}
        title={
          messages.SHORTCUT_LABEL +
          messages.CTRL_KEY_LABEL +
          constants.ADD_FILES_KEY
        }
      >
        {messages.ADD_FILES_BUTTON_LABEL}
      </button>
      <input
        onChange={handleChange}
        ref={fileInputRef}
        type="file"
        multiple
        hidden
      />
    </>
  );
}

function ImportZipButton({
  importZipButtonRef,
  onImportZipFile,
  constants,
  messages
}) {
  const fileInput = useRef(null);
  const { current } = fileInput;

  function handleClick() {
    current.click();
  }

  return (
    <>
      <button
        onClick={handleClick}
        ref={importZipButtonRef}
        title={
          messages.SHORTCUT_LABEL +
          messages.CTRL_KEY_LABEL +
          constants.IMPORT_ZIP_KEY
        }
      >
        {messages.IMPORT_ZIP_BUTTON_LABEL}
      </button>
      <input
        onChange={({ target }) => onImportZipFile(target.files[0])}
        ref={fileInput}
        type="file"
        accept={messages.ZIP_EXTENSION}
        hidden
      />
    </>
  );
}

function ExportZipButton({ disabled, onExportZipFile, constants, messages }) {
  return (
    <button
      onClick={onExportZipFile}
      disabled={disabled}
      title={
        messages.SHORTCUT_LABEL +
        messages.CTRL_KEY_LABEL +
        constants.EXPORT_ZIP_KEY
      }
    >
      {messages.EXPORT_ZIP_BUTTON_LABEL}
    </button>
  );
}

function ResetButton({ disabled, onReset, messages }) {
  return (
    <button onClick={onReset} disabled={disabled}>
      {messages.RESET_BUTTON_LABEL}
    </button>
  );
}

export default TopButtonBar;
