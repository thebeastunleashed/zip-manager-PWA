function getSelectedFolderFeatures({
  selectedFolder,
  rootZipFilename,
  setExportZipDialogOpened,
  setExportZipFilename,
  setExportZipPassword,
  setCreateFolderDialogOpened,
  updateSelectedFolder,
  highlightEntries,
  removeDownload,
  downloadFile,
  displayError,
  constants
}) {
  const { DEFAULT_MIME_TYPE, ZIP_EXTENSION } = constants;

  function promptCreateFolder() {
    setCreateFolderDialogOpened(true);
  }

  function createFolder({ folderName }) {
    try {
      const entry = selectedFolder.addDirectory(folderName);
      highlightEntries([entry]);
      updateSelectedFolder();
    } catch (error) {
      displayError(error.message);
    }
  }

  function addFiles(files) {
    const addedEntries = [];
    files.forEach((file) => {
      try {
        addedEntries.push(
          selectedFolder.addBlob(file.name, file, {
            lastModDate: new Date(file.lastModified)
          })
        );
      } catch (error) {
        displayError(error.message);
      }
    });
    if (addedEntries.length) {
      highlightSortedEntries(addedEntries);
    }
    updateSelectedFolder();
  }

  function importZipFile(zipFile) {
    async function updateZipFile() {
      const children = [...selectedFolder.children];
      try {
        await selectedFolder.importBlob(zipFile);
      } catch (error) {
        displayError(error.message);
      }
      const addedEntries = selectedFolder.children.filter(
        (entry) => !children.includes(entry)
      );
      if (addedEntries.length) {
        highlightSortedEntries(addedEntries);
      }
      updateSelectedFolder();
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

  function promptExportZip() {
    setExportZipFilename(
      selectedFolder.name
        ? selectedFolder.name + ZIP_EXTENSION
        : rootZipFilename
    );
    setExportZipPassword("");
    setExportZipDialogOpened(true);
  }

  function exportZip({ filename, password }) {
    async function exportZip() {
      try {
        await downloadFile(
          filename,
          { mimeType: DEFAULT_MIME_TYPE },
          async (download, options) => {
            try {
              return await selectedFolder.exportBlob({
                ...options,
                bufferedWrite: true,
                keepOrder: true,
                password
              });
            } finally {
              removeDownload(download);
            }
          }
        );
      } catch (error) {
        displayError(error.message);
      }
    }

    exportZip();
  }

  return {
    promptCreateFolder,
    createFolder,
    addFiles,
    importZipFile,
    promptExportZip,
    exportZip
  };
}

export default getSelectedFolderFeatures;
