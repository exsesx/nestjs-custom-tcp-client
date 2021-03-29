import * as net from "net";
import { v4 as uuid } from "uuid";
import { Serializer } from "./serializer";

export interface ClientOptions {
  host: string;
  port: number;
}

interface ServerResponse<T = any> {
  id: string;
  err?: Error;
  response: T;
  isDisposed: boolean; // TODO: Maybe this is related to chunked data...
}

interface ResponseCallbackParams<T = any> {
  err?: Error;
  response: T;
  isDisposed?: boolean;
}

interface Client {
  connect(): Promise<void>;
  close(): any;
  send<T = any>(pattern: string, payload: any): Promise<T>;
  emit(pattern: string, payload: any);
}

export class ClientTCP implements Client {
  private isConnected: boolean;
  private socket: net.Socket;
  private readonly routingMap: Map<
    string,
    (params: ResponseCallbackParams) => void
  >;
  private readonly serializer: Serializer;
  private readonly host: ClientOptions["host"];
  private readonly port: ClientOptions["port"];

  constructor(options: ClientOptions) {
    this.host = options.host;
    this.port = options.port;
    this.socket = new net.Socket();
    this.serializer = new Serializer();
    this.routingMap = new Map();
    this.isConnected = false;

    this.bindEvents(this.socket);
    this.handleResponse = this.handleResponse.bind(this);
  }

  private bindEvents(socket) {
    // socket.on(
    //   "error",
    //   (err) => err.code !== "ECONNREFUSED" && this.handleError(err)
    // );
    socket.on("error", this.handleError);
    socket.on("close", this.handleClose);
  }

  private sendMessage(buffer: Uint8Array | string): Promise<void> {
    return new Promise((resolve, reject) =>
      this.socket.write(buffer, (err) => (err ? reject(err) : resolve()))
    );
  }

  private handleResponse(buffer) {
    const {
      id,
      err,
      response,
      isDisposed,
    } = this.serializer.deserialize<ServerResponse>(buffer);

    const callback = this.routingMap.get(id);

    if (!callback) {
      return undefined;
    }

    if (isDisposed || err) {
      return callback({
        err,
        response,
        isDisposed: true,
      });
    }

    callback({
      err,
      response,
    });
  }

  private handleError(err) {
    console.error(err);
  }

  private handleClose() {
    this.isConnected = false;
    this.socket = null;
  }

  public connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isConnected) {
        return resolve();
      }

      this.socket.connect(this.port, this.host, () => {
        this.isConnected = true;
        this.socket.on("data", this.handleResponse);

        resolve();
      });
    });
  }

  public close() {
    this.socket && this.socket.end();
    this.handleClose();
  }

  public async send<T = any>(pattern: string, payload: any): Promise<T> {
    await this.connect();

    return new Promise(async (resolve, reject) => {
      const id = uuid();

      this.routingMap.set(id, ({ err, response }) => {
        this.routingMap.delete(id);

        if (err) {
          reject(err);
          return;
        }

        resolve(response);
      });
      await this.sendMessage(
        this.serializer.serialize({ id, pattern, data: payload })
      );
    });
  }

  public async emit(pattern: string, payload: any) {
    await this.connect();

    await this.sendMessage(
      this.serializer.serialize({ pattern, data: payload })
    );
  }
}
