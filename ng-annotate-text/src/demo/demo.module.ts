import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { NgAnnotateTextModule } from '../lib/ng-annotate-text.module';
import { DemoComponent } from './demo.component';

@NgModule({
  declarations: [
    DemoComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    NgAnnotateTextModule
  ],
  providers: [],
  bootstrap: [DemoComponent]
})
export class DemoModule { } 