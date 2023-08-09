export type Reference = object

export type Document = {
    ref: Reference,
    data: any,
    ts: number
}

export type Message = {
    sender: string;
    command: string;
    params?: {
      message?: string;
      nickname?: string;
    }
  }