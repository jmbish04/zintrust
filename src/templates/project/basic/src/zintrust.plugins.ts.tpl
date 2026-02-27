/**
 * ZinTrust plugin auto-imports
 *
 * This file is managed by `zin plugin install` and contains side-effect
 * imports that register optional adapters/drivers into core registries.
 */

// Intentionally empty by default.
//
// Example: pre-register persisted worker processorSpec mappings.
// Uncomment and adapt to your project as needed.
//
// import { ZinTrustProcessor } from '@app/Workers/AdvancEmailWorker';
// import { WorkerFactory, type WorkerFactoryConfig } from '@zintrust/workers';
//
// type PreRegisteredProcessorSpec = {
//   processorSpec: string;
//   processor: WorkerFactoryConfig['processor'];
// };
//
// export const preRegisteredWorkerProcessorSpecs: ReadonlyArray<PreRegisteredProcessorSpec> = [
//   {
//     processorSpec: 'https://wk.zintrust.com/AdvancEmailWorker.js',
//     processor: ZinTrustProcessor,
//   },
// ];
//
// for (const entry of preRegisteredWorkerProcessorSpecs) {
//   WorkerFactory.registerProcessorSpec(entry.processorSpec, entry.processor);
// }
