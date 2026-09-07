import { getMetadataArgsStorage } from 'typeorm';

import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Workshop } from '../workshops/entities/workshop.entity';

describe('Database entities', () => {
  it('defines required tables and relations', () => {
    const tables = getMetadataArgsStorage().tables.map((table) => table.target);
    const relations = getMetadataArgsStorage().relations;

    expect(tables).toEqual(expect.arrayContaining([User, Workshop, Booking]));
    expect(
      relations.some(
        (relation) =>
          relation.target === Booking && relation.propertyName === 'user',
      ),
    ).toBe(true);
    expect(
      relations.some(
        (relation) =>
          relation.target === Booking && relation.propertyName === 'workshop',
      ),
    ).toBe(true);
  });

  it('defines database uniqueness constraints', () => {
    const columns = getMetadataArgsStorage().columns;
    const uniqueColumns = columns
      .filter((column) => column.options.unique)
      .map((column) => `${String(column.target)}:${column.propertyName}`);
    const uniqueConstraints = getMetadataArgsStorage().uniques;

    expect(uniqueColumns).toEqual(
      expect.arrayContaining([
        `${String(User)}:email`,
        `${String(User)}:username`,
        `${String(Workshop)}:title`,
      ]),
    );
    expect(
      uniqueConstraints.some(
        (constraint) =>
          constraint.target === Booking &&
          Array.isArray(constraint.columns) &&
          constraint.columns.includes('user') &&
          constraint.columns.includes('workshop'),
      ),
    ).toBe(true);
  });
});
