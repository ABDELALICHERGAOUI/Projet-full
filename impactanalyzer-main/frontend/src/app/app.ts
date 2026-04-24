import { Component } from '@angular/core';
import { ServiceListComponent } from './components/service-list/service-list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ServiceListComponent],
  template: `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>📊 Smart Dependency Impact Analyzer</h1>
      <p>Bienvenue sur l'application de simulation d'impact</p>
      <hr />
      <app-service-list></app-service-list>
    </div>
  `,
})
export class AppComponent {}
