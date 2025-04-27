import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnnotateTextComponent } from './annotate-text.component';
import { AnnotationPopupComponent } from './annotation-popup.component';
import { AnnotationTooltipComponent } from './annotation-tooltip.component';

@NgModule({
  declarations: [
    AnnotateTextComponent,
    AnnotationPopupComponent,
    AnnotationTooltipComponent
  ],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    AnnotateTextComponent
  ]
})
export class NgAnnotateTextModule { } 