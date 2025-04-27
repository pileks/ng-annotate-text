import {
  Component,
  Input,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Renderer2,
  ChangeDetectorRef
} from '@angular/core';
import { Annotation } from './models/annotation.model';
import { PositionService } from './services/position.service';

@Component({
  selector: 'ng-annotation-tooltip',
  template: `
    <div 
      class="ng-annotate-text-tooltip"
      [class.ng-annotate-text-tooltip-docked-left]="edge === 'left'"
      [class.ng-annotate-text-tooltip-docked-right]="edge === 'right'"
      [class.ng-annotate-text-tooltip-docked-top]="edge === 'top'"
      [class.ng-annotate-text-tooltip-docked-bottom]="edge === 'bottom'">
      
      <div class="tooltip-content">
        <ng-content></ng-content>
        
        <!-- Default content if no template is provided -->
        <div *ngIf="!hasContent">
          <div *ngIf="annotation.data.comment" class="tooltip-comment">
            {{ annotation.data.comment }}
          </div>
          <div *ngIf="annotation.data.points" class="tooltip-points">
            {{ annotation.data.points }} points
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ng-annotate-text-tooltip {
      position: absolute;
      z-index: 1000;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 8px 12px;
      max-width: 250px;
      font-size: 14px;
    }
    
    .tooltip-content {
      overflow-wrap: break-word;
    }
    
    .tooltip-comment {
      margin-bottom: 4px;
    }
    
    .tooltip-points {
      font-weight: bold;
    }
    
    /* Positioning arrow styles */
    .ng-annotate-text-tooltip-docked-left:before {
      content: '';
      position: absolute;
      left: -6px;
      top: 50%;
      margin-top: -6px;
      border: 6px solid transparent;
      border-right-color: white;
      z-index: 1;
    }
    
    .ng-annotate-text-tooltip-docked-right:before {
      content: '';
      position: absolute;
      right: -6px;
      top: 50%;
      margin-top: -6px;
      border: 6px solid transparent;
      border-left-color: white;
      z-index: 1;
    }
    
    .ng-annotate-text-tooltip-docked-top:before {
      content: '';
      position: absolute;
      top: -6px;
      left: 50%;
      margin-left: -6px;
      border: 6px solid transparent;
      border-bottom-color: white;
      z-index: 1;
    }
    
    .ng-annotate-text-tooltip-docked-bottom:before {
      content: '';
      position: absolute;
      bottom: -6px;
      left: 50%;
      margin-left: -6px;
      border: 6px solid transparent;
      border-top-color: white;
      z-index: 1;
    }
  `]
})
export class AnnotationTooltipComponent implements AfterViewInit, OnDestroy {
  @Input() annotation!: Annotation;
  @Input() anchor!: HTMLElement;
  @Input() offset: number = 10;
  
  edge: string = '';
  hasContent = false;
  private hideTimeout: any = null;
  
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private positionService: PositionService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.checkContent();
    this.appendToBody();
    this.position();
    this.show();
    
    // Re-position on window resize
    window.addEventListener('resize', this.onWindowResize);
    
    // Listen for mouseenter and mouseleave on the tooltip itself
    this.el.nativeElement.addEventListener('mouseenter', this.onTooltipMouseEnter);
    this.el.nativeElement.addEventListener('mouseleave', this.onTooltipMouseLeave);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onWindowResize);
    
    if (this.el && this.el.nativeElement) {
      this.el.nativeElement.removeEventListener('mouseenter', this.onTooltipMouseEnter);
      this.el.nativeElement.removeEventListener('mouseleave', this.onTooltipMouseLeave);
    }
    
    this.clearHideTimeout();
  }

  private onWindowResize = (): void => {
    this.position();
  }
  
  private onTooltipMouseEnter = (): void => {
    this.stopDestroy();
  }
  
  private onTooltipMouseLeave = (): void => {
    this.startDestroy();
  }

  private checkContent(): void {
    // Check if custom content is provided via content projection
    this.hasContent = this.el.nativeElement.querySelector('ng-content').children.length > 0;
  }

  private appendToBody(): void {
    // Append tooltip to body for better positioning
    this.renderer.appendChild(document.body, this.el.nativeElement);
  }

  private position(): void {
    if (!this.el || !this.anchor) return;
    
    const position = this.positionService.calculatePosition(
      this.el.nativeElement,
      this.anchor,
      {
        preferredAxis: 'y', // Prefer positioning above/below for tooltips
        offset: this.offset
      }
    );
    
    this.renderer.setStyle(this.el.nativeElement, 'top', `${position.top}px`);
    this.renderer.setStyle(this.el.nativeElement, 'left', `${position.left}px`);
    
    this.edge = position.edge || '';
    this.cdr.detectChanges();
  }
  
  private show(): void {
    // Show with a fade-in effect
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
    this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
    
    // Force reflow to enable transition
    this.el.nativeElement.offsetHeight;
    
    // Fade in
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'opacity 200ms ease-in');
  }
  
  private startDestroy(): void {
    this.hideTimeout = setTimeout(() => {
      // Fade out before removal
      this.renderer.setStyle(this.el.nativeElement, 'opacity', '0');
      
      // Allow time for fade-out effect
      setTimeout(() => {
        this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
      }, 200);
    }, 300);
  }
  
  stopDestroy(): void {
    this.clearHideTimeout();
    
    // Ensure tooltip is visible
    this.renderer.setStyle(this.el.nativeElement, 'opacity', '1');
    this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
  }
  
  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }
} 