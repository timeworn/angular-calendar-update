import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CalendarModule, CalendarUtils } from 'angular-calendar';
import { DemoUtilsModule } from '../demo-utils/module';
import { DemoComponent } from './component';
import { CalendarUtilsDateFns } from 'angular-calendar/calendar-utils/date-fns';

registerLocaleData(localeFr);

@NgModule({
  imports: [
    CommonModule,
    CalendarModule.forRoot({
      provide: CalendarUtils,
      useClass: CalendarUtilsDateFns
    }),
    DemoUtilsModule,
    RouterModule.forChild([{ path: '', component: DemoComponent }])
  ],
  declarations: [DemoComponent],
  exports: [DemoComponent]
})
export class DemoModule {}
