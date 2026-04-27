import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ClientserviceApi {
  ClSrv =[
    { id: 1, nameClient: 'Fatiha Belhaj', nameService: 'autho' },
    { id: 2, nameClient: 'atae elazhari', nameService: 'notification' },
  ]
  constructor() {
  }
  getAllClientServices(){
    return this.ClSrv;
  }
  deleteClientService(Cl : any){
    this.ClSrv = this.ClSrv.filter((CS:any) => CS.id != Cl.id);


  }
}
