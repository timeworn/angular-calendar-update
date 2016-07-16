import {Component, Input, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';
import {NgFor, NgClass, DatePipe} from '@angular/common';
import {
  WeekDay,
  CalendarEvent,
  WeekViewEventRow,
  getWeekViewHeader,
  getWeekView
} from 'calendar-utils';
import {CalendarDate} from './calendarDate.pipe';

@Component({
  selector: 'mwl-calendar-week-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="calendar-week-view">
      <div class="day-headers">
        <div
          class="header"
          *ngFor="let day of days"
          [class.past]="day.isPast"
          [class.today]="day.isToday"
          [class.future]="day.isFuture"
          [class.weekend]="day.isWeekend"
          (click)="dayClicked.emit({date: day.date.toDate()})">
          <b>{{ day.date | calendarDate:'week':'columnHeader' }}</b><br>
          <span>{{ day.date | calendarDate:'week':'columnSubHeader' }}</span>
        </div>
      </div>
      <div *ngFor="let eventRow of eventRows">
        <div
          class="event-container"
          *ngFor="let event of eventRow.row"
          [style.width]="((100 / 7) * event.span) + '%'"
          [style.marginLeft]="((100 / 7) * event.offset) + '%'">
          <div
            class="event"
            [class.border-left-rounded]="!event.extendsLeft"
            [class.border-right-rounded]="!event.extendsRight"
            [style.backgroundColor]="event.event.color.secondary"
            [ngClass]="event.event?.cssClass">
            <a
              class="event-title"
              href="javascript:;"
              [innerHtml]="event.event.title"
              (click)="eventClicked.emit({event: event.event})">
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  directives: [NgFor, NgClass],
  pipes: [CalendarDate],
  providers: [DatePipe]
})
export class CalendarWeekView {

  @Input() date: Date;
  @Input() events: CalendarEvent[] = [];
  @Output() dayClicked: EventEmitter<any> = new EventEmitter();
  @Output() eventClicked: EventEmitter<any> = new EventEmitter();

  private days: WeekDay[];
  private eventRows: WeekViewEventRow[] = [];

  ngOnChanges(changes: any): void {

    if (changes.date) {
      this.days = getWeekViewHeader({
        viewDate: this.date
      });
    }

    if (changes.events || changes.date) {

      this.eventRows = getWeekView({
        events: this.events,
        viewDate: this.date
      });

    }

  }

}
