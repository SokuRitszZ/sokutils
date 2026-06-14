export type Unlock = () => void;
export type Release = Unlock;
export type Lock = () => Promise<Unlock>;
