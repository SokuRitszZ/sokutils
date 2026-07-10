export type SchedulePool<Meta> = Set<Meta>;

export type ScheduleResolver = () => void;

export type ScheduleUnlock = () => void;

export type ScheduleLock<Input extends any[]> = (...input: Input) => Promise<ScheduleUnlock>;

export interface ScheduleCoreOptions<Meta extends object, Input extends any[]> {
  JobCapacity: number;
  Strategy: ScheduleStrategy<Meta, Input>;
}

export type ScheduleStrategyPend<Meta, Input extends any[]> = (...input: Input) => Meta;

export interface ScheduleStrategyPickOptions<Meta> {
  PendingPool: SchedulePool<Meta>;
  ProcessingPool: SchedulePool<Meta>;
}

export type ScheduleStrategyPickResult<Meta> = Meta | undefined;

export type ScheduleStrategyPick<Meta> = (
  options: ScheduleStrategyPickOptions<Meta>,
) => ScheduleStrategyPickResult<Meta>;

export interface ScheduleStrategy<Meta extends object, Input extends any[]> {
  Pick: ScheduleStrategyPick<Meta>;
  Pend: ScheduleStrategyPend<Meta, Input>;
}

export type ScheduleStrategyBuilder<
  Options extends any[],
  Meta extends object,
  Input extends any[],
> = (...options: Options) => ScheduleStrategy<Meta, Input>;
