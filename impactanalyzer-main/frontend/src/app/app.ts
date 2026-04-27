import { Component, signal } from '@angular/core';
import { ServiceListComponent } from './components/service-list/service-list';
import { ClientComponent } from './components/client/client';
import {RouterLink, RouterOutlet} from "@angular/router";

/*
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ServiceListComponent,ClientComponent],
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>📊 Smart Dependency Impact Analyzer</h1>
      <p>Bienvenue sur l'application de simulation d'impact</p>
      <hr />
      <app-service-list></app-service-list>
      <hr />
      <app-client></app-client>

    </div>
  `,
})
*/
//export class AppComponent {}

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('frontend');
}
