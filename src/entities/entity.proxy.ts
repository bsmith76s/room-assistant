import { Entity } from './entity.dto';
import { AttributesProxyHandler } from './attributes.proxy';
import { EntitiesEventEmitter } from './entities.events';

export class EntityProxyHandler implements ProxyHandler<Entity> {
  constructor(
    private readonly emitter: EntitiesEventEmitter,
    private readonly isLeader: () => boolean
  ) {}

  get(target: Entity, p: string | number | symbol): any {
    if (p === 'attributes') {
      return new Proxy(
        target[p],
        new AttributesProxyHandler(
          target.id,
          target.distributed,
          target.stateLocked,
          this.emitter,
          this.isLeader
        )
      );
    } else {
      return target[p];
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  set(target: Entity, p: string | number | symbol, value: any): boolean {
    const oldValue = target[p];
    target[p] = value;

    if (
      p === 'state' &&
      oldValue !== value &&
      (!target.distributed || !target.stateLocked || this.isLeader())
    ) {
      this.emitter.emit('stateUpdate', target.id, value, target.distributed);
    }

    return true;
  }
}
