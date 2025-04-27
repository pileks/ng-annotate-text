import { Injectable, ElementRef } from '@angular/core';

export interface Position {
  left: number | null;
  top: number | null;
  edge?: string;
}

export interface PositionPreferences {
  preferredAxis: 'x' | 'y';
  offset: number;
}

@Injectable({
  providedIn: 'root'
})
export class PositionService {

  /**
   * Calculate the position for a popup element
   */
  calculatePosition(
    targetEl: HTMLElement,
    anchorEl: HTMLElement,
    preferences: PositionPreferences
  ): Position {
    if (!targetEl || !anchorEl) {
      return { left: 0, top: 0 };
    }

    const pos = {
      left: null as number | null,
      top: null as number | null,
      edge: undefined as string | undefined,
      target: targetEl.getBoundingClientRect(),
      anchor: anchorEl.getBoundingClientRect(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      scroll: {
        top: document.documentElement.scrollTop || document.body.scrollTop,
        left: document.documentElement.scrollLeft || document.body.scrollLeft
      }
    };

    if (!(pos.target.width > 0 && pos.target.height > 0)) {
      return { left: 0, top: 0 };
    }

    // Find first axis position
    const posX = this.getNewPositionOnAxis(pos, 'x', preferences.offset);
    const posY = this.getNewPositionOnAxis(pos, 'y', preferences.offset);

    if (preferences.preferredAxis === 'x') {
      if (posX && typeof posX.pos === 'number') {
        pos.left = posX.pos;
        pos.edge = posX.edge;
      } else if (posY) {
        pos.top = posY.pos;
        pos.edge = posY.edge;
      }
    } else {
      if (posY && typeof posY.pos === 'number') {
        pos.top = posY.pos;
        pos.edge = posY.edge;
      } else if (posX) {
        pos.left = posX.pos;
        pos.edge = posX.edge;
      }
    }

    // Center on second axis
    if (pos.left === null && pos.top === null) {
      // Center on X and Y axes
      pos.left = pos.scroll.left + (pos.viewport.width / 2) - (pos.target.width / 2);
      pos.top = pos.scroll.top + (pos.viewport.height / 2) - (pos.target.height / 2);
    } else if (pos.left === null) {
      // Center on X axis
      pos.left = this.getNewCenterPositionOnAxis(pos, 'x', preferences.offset);
    } else if (pos.top === null) {
      // Center on Y axis
      pos.top = this.getNewCenterPositionOnAxis(pos, 'y', preferences.offset);
    }

    return {
      left: Math.round(pos.left!) || 0,
      top: Math.round(pos.top!) || 0,
      edge: pos.edge
    };
  }

  private getNewPositionOnAxis(pos: any, axis: 'x' | 'y', offset: number): { pos: number, edge: string } | undefined {
    const start = axis === 'x' ? 'left' : 'top';
    const end = axis === 'x' ? 'right' : 'bottom';
    const size = axis === 'x' ? 'width' : 'height';
    
    let axisPos: { pos: number, edge: string } | undefined;

    if (pos.anchor[start] - offset >= pos.target[size]) {
      axisPos = {
        pos: pos.scroll[start] + pos.anchor[start] - offset - pos.target[size],
        edge: start
      };
    } else if (pos.viewport[size] - pos.anchor[end] - offset >= pos.target[size]) {
      axisPos = {
        pos: pos.scroll[start] + pos.anchor[end] + offset,
        edge: end
      };
    }
    return axisPos;
  }

  private getNewCenterPositionOnAxis(pos: any, axis: 'x' | 'y', offset: number): number {
    const start = axis === 'x' ? 'left' : 'top';
    const size = axis === 'x' ? 'width' : 'height';
    const centerPos = pos.scroll[start] + pos.anchor[start] + (pos.anchor[size] / 2) - (pos.target[size] / 2);
    return Math.max(
      pos.scroll[start] + offset, 
      Math.min(
        centerPos, 
        pos.scroll[start] + pos.viewport[size] - pos.target[size] - offset
      )
    );
  }
} 