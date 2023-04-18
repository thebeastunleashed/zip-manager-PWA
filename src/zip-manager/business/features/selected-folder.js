function getSelectedFolderFeatures({
  zipFilesystem,
  selectedFolder,
  rootZipFilename,
  clipboardData,
  chooseActionDialog,
  setHighlightedIds,
  setClipboardData,
  setImportPasswordDialog,
  setExportZipDialog,
  setCreateFolderDialog,
  setChooseActionDialog,
  refreshSelectedFolder,
  highlightEntries,
  saveEntry,
  getOptions,
  openDisplayError,
  util,
  constants
}) {
  function openPromptCreateFolder() {
    setCreateFolderDialog({});
  }

  function createFolder({ folderName }) {
    try {
      const entry = selectedFolder.addDirectory(folderName);
      highlightEntries([entry]);
      refreshSelectedFolder();
    } catch (error) {
      openDisplayError(error.message);
    }
  }

  function closePromptCreateFolder() {
    setCreateFolderDialog(null);
  }

  function addFiles(files, options = {}) {
    const addFilesPrevented = handleZipFile(files, addFiles, options);
    if (!addFilesPrevented) {
      const addedEntries = [];
      try {
        files.forEach((file) => {
          try {
            addedEntries.push(
              selectedFolder.addBlob(file.name, file, {
                lastModDate: new Date(file.lastModified)
              })
            );
          } catch (error) {
            const message =
              error.message + (file ? " (" + file.name + ")" : "");
            throw new Error(message);
          }
        });
      } catch (error) {
        openDisplayError(error.message);
      }
      if (addedEntries.length) {
        highlightSortedEntries(addedEntries);
      }
      refreshSelectedFolder();
    }
  }

  function dropFiles(handles, options = {}) {
    async function dropFiles() {
      const droppedEntries = [];
      const firstHandle = handles[0];
      try {
        const dropFilesPrevented =
          firstHandle.kind === util.FILESYSTEM_FILE_KIND &&
          handleZipFile([await firstHandle.getFile()], dropFiles, options);
        if (!dropFilesPrevented) {
          await Promise.all(
            handles.map((handle) =>
              addFile(handle, selectedFolder, droppedEntries)
            )
          );
          const addedChildEntries = selectedFolder.children.filter((entry) =>
            droppedEntries.includes(entry)
          );
          highlightSortedEntries(addedChildEntries);
          refreshSelectedFolder();
        }
      } catch (error) {
        openDisplayError(error.message);
      }
    }

    async function addFile(entry, parentEntry, addedEntries) {
      try {
        if (entry.kind === util.FILESYSTEM_FILE_KIND) {
          const file = await entry.getFile();
          const fileEntry = parentEntry.addBlob(entry.name, file);
          addedEntries.push(fileEntry);
        } else if (entry.kind === util.FILESYSTEM_DIRECTORY_KIND) {
          const directoryEntry = parentEntry.addDirectory(entry.name);
          addedEntries.push(directoryEntry);
          for await (const value of entry.values()) {
            await addFile(value, directoryEntry, addedEntries);
          }
        }
      } catch (error) {
        const message = error.message + (entry ? " (" + entry.name + ")" : "");
        throw new Error(message);
      }
      return addedEntries;
    }

    dropFiles();
  }

  function handleZipFile(files, callback, { forceAddFiles }) {
    const zipFileDetected =
      files.length === 1 &&
      constants.ZIP_EXTENSIONS.find((extension) =>
        files[0].name.endsWith(extension)
      ) &&
      !forceAddFiles;
    if (zipFileDetected) {
      if (chooseActionDialog) {
        callback(files, { forceAddFiles: true });
      } else {
        setChooseActionDialog({ files });
      }
    }
    return zipFileDetected;
  }

  function closeChooseAction() {
    setChooseActionDialog(null);
  }

  function importZipFile(zipFile, options = {}) {
    async function updateZipFile() {
      let importedEntries = [];
      try {
        const importedEntries = await selectedFolder.importBlob(
          zipFile,
          options
        );
        const isPasswordProtected = (
          await Promise.all(
            importedEntries.map(
              (entry) => !entry.directory && entry.isPasswordProtected()
            )
          )
        ).includes(true);
        if (isPasswordProtected && !options.password) {
          cleanup(importedEntries);
          const { password } = await new Promise((resolve) =>
            setImportPasswordDialog({ onSetImportPassword: resolve })
          );
          const isValidPassword = !(
            await Promise.all(
              importedEntries.map(
                (entry) => entry.directory || entry.checkPassword(password)
              )
            )
          ).includes(false);
          importZipFile(zipFile, isValidPassword ? { password } : {});
        } else {
          const addedChildEntries = selectedFolder.children.filter((entry) =>
            importedEntries.includes(entry)
          );
          highlightSortedEntries(addedChildEntries);
          refreshSelectedFolder();
        }
      } catch (error) {
        cleanup(importedEntries);
        const entry = error?.cause?.entry;
        const paths = entry && entry.filename.split("/");
        const message =
          error.message +
          (paths && paths.length ? " (" + paths.pop() + ")" : "");
        openDisplayError(message);
      }
    }

    function cleanup(importedEntries) {
      importedEntries.forEach(
        (entry) => !entry.directory && zipFilesystem.remove(entry)
      );
      importedEntries.forEach(
        (entry) =>
          entry.directory &&
          !entry.children.length &&
          zipFilesystem.remove(entry)
      );
    }

    updateZipFile();
  }

  function highlightSortedEntries(entries) {
    highlightEntries(
      entries.sort((previousChild, nextChild) =>
        nextChild.name.localeCompare(previousChild.name)
      )
    );
  }

  function openPromptExportZip() {
    const filename = selectedFolder.name
      ? selectedFolder.name + constants.ZIP_EXTENSION
      : rootZipFilename;
    const options = getOptions();
    const password = options.defaultExportPassword;
    if (!util.savePickersSupported() || options.promptForExportPassword) {
      setExportZipDialog({
        filename,
        filenameHidden: util.savePickersSupported(),
        password
      });
    } else {
      exportZip({ filename, password });
    }
  }

  function closePromptExportZip() {
    setExportZipDialog(null);
  }

  function exportZip({ filename, password }) {
    function getWritable(writable, options) {
      return selectedFolder.exportWritable(writable, options);
    }

    async function exportZip() {
      try {
        const options = getOptions();
        await saveEntry({ filename, getWritable }, filename, {
          ...options,
          password,
          readerOptions: {
            checkSignature: options.checkSignature
          }
        });
      } catch (error) {
        openDisplayError(error.message);
      }
    }

    exportZip();
  }

  function paste() {
    try {
      const { entries, cut } = clipboardData;
      if (cut) {
        entries.forEach((entry) => {
          try {
            zipFilesystem.move(entry, selectedFolder);
          } catch (error) {
            const message = error.message + (" (" + entry.name + ")");
            throw new Error(message);
          }
        });
      } else {
        const clones = entries.map((entry) => {
          let clone = entry.clone(true);
          try {
            zipFilesystem.move(entry, selectedFolder);
          } catch (error) {
            const message = error.message + (" (" + entry.name + ")");
            throw new Error(message);
          }
          return clone;
        });
        setClipboardData({ entries: clones });
      }
      setHighlightedIds(entries.map((entry) => entry.id));
      refreshSelectedFolder();
    } catch (error) {
      openDisplayError(error.message);
    }
  }

  function closePromptImportPassword() {
    setImportPasswordDialog(null);
  }

  return {
    openPromptCreateFolder,
    createFolder,
    closePromptCreateFolder,
    addFiles,
    dropFiles,
    closeChooseAction,
    importZipFile,
    openPromptExportZip,
    exportZip,
    paste,
    closePromptExportZip,
    closePromptImportPassword
  };
}

export default getSelectedFolderFeatures;
