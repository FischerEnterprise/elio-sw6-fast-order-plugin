import FastOrderCsvUploadPlugin from "./plugin/fast-order-csv-upload/fast-order-csv-upload.plugin";
import FastOrderAdjustableFormPlugin from './plugin/fast-order-adjustable-form/fast-order-adjustable-form.plugin';

const PluginManager = window.PluginManager;
PluginManager.register('FastOrderCsvUploadPlugin', FastOrderCsvUploadPlugin, '[data-fast-order-csv-upload-plugin]');
PluginManager.register('FastOrderAdjustableFormPlugin', FastOrderAdjustableFormPlugin, '[data-fast-order-adjustable-form-plugin]')
