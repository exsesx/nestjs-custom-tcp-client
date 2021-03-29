export class Serializer {
  private readonly delimiter: string;

  constructor() {
    this.delimiter = "#";
  }

  public serialize(data: Record<string, any>): Uint8Array | string {
    const message = JSON.stringify(data);

    return message.length + this.delimiter + message;
  }

  public deserialize<T = any>(buffer: Uint8Array | string): T {
    const message = buffer.toString();
    const [, data] = message.split(this.delimiter);

    return JSON.parse(data);
  }
}
