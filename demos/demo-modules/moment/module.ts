import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  CalendarDateFormatter,
  CalendarModule,
  CalendarMomentDateFormatter,
  DateAdapter,
  MOMENT
} from 'angular-calendar';
import moment from 'moment';
import { DemoUtilsModule } from '../demo-utils/module';
import { DemoComponent } from './component';
import { adapterFactory } from 'angular-calendar/date-adapters/moment';

@NgModule({
  imports: [
    CommonModule,
    CalendarModule.forRoot(
      {
        provide: DateAdapter,
        useFactory: function() {
          // tslint:disable-line
          return adapterFactory(moment);
        }
      },
      {
        dateFormatter: {
          provide: CalendarDateFormatter,
          useClass: CalendarMomentDateFormatter
        }
      }
    ),
    DemoUtilsModule,
    RouterModule.forChild([{ path: '', component: DemoComponent }])
  ],
  declarations: [DemoComponent],
  exports: [DemoComponent],
  providers: [
    {
      provide: MOMENT,
      useValue: moment
    }
  ]
})
export class DemoModule {}
