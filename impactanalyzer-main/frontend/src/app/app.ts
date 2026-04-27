import { Component, signal } from '@angular/core';
import { ServiceListComponent } from './components/service-list/service-list';
import { ClientComponent } from './components/client/client';
import {RouterLink, RouterOutlet} from "@angular/router";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}
