export interface ICue {
  identifier: string | number | null;
  start: number | `${number}`;
  end: number | `${number}`;
  text: string;
  styles: string;
}

export interface IParsedCue extends ICue {
  start: number;
  end: number;
}
