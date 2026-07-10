import type { ScheduleStrategyBuilder } from './types';

export const ScheduleDefineStrategy =
  <Options extends any[], Meta extends object, Input extends any[]>
  (builder: ScheduleStrategyBuilder<Options, Meta, Input>) => {
    return builder;
  };
