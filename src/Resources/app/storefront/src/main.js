import FastOrderCsvUploadPlugin from "./plugin/fast-order-csv-upload/fast-order-csv-upload.plugin";

const PluginManager = window.PluginManager;
PluginManager.register('FastOrderCsvUploadPlugin', FastOrderCsvUploadPlugin, '[data-fast-order-csv-upload-plugin]');
