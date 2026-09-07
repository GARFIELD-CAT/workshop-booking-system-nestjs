import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getApiRoot() {
    return {
      workshops: '/api/workshops/',
      bookings: '/api/bookings/',
    };
  }
}
