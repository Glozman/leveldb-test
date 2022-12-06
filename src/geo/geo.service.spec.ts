import { Test, TestingModule } from '@nestjs/testing';
import { GeoService } from './geo.service';
import { CACHE_MANAGER } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

const mockCacheManager = {
  get: jest.fn((address) => {
    if (address === 'Germany') {
      return address;
    }
    return null;
  }),
  set: jest.fn(),
};

const mockGoogleService = jest.fn((address, apiType) => {
  if (address !== undefined) {
    return address;
  }
  return {};
});
describe('GeoService', () => {
  let service: GeoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        GeoService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<GeoService>(GeoService);
  });

  it('get value from local db, should return: cashed: true', async () => {
    const address = 'Germany';
    const apiType = 'countryOnly';
    jest.spyOn(service, 'checkAddressLocally').mockImplementation(() => {
      return mockCacheManager.get(address);
    });
    const res = await service.buildLngLatByAddress({ address, apiType });
    expect(res).toMatchObject({ cached: true });
  });

  it('get value from google service, should return: get: false', async () => {
    const address = 'Spain';
    const apiType = 'countryOnly';

    jest.spyOn(service, 'checkAddressLocally').mockImplementation(() => {
      return mockCacheManager.get(address);
    });

    jest.spyOn(service, 'getAddressFromGoogle').mockImplementation(() => {
      return mockGoogleService(address, apiType);
    });
    const res = await service.buildLngLatByAddress({ address, apiType });
    expect(res).toMatchObject({ cached: false });
  });

  it('should save locally value from google service', async () => {
    const address = 'Spain';
    const value = 'Spain';
    const apiType = 'countryOnly';

    jest.spyOn(service, 'checkAddressLocally').mockImplementation(() => {
      return mockCacheManager.get(address);
    });

    jest.spyOn(service, 'saveAddressLocally').mockImplementation(() => {
      return mockCacheManager.set();
    });

    jest.spyOn(service, 'getAddressFromGoogle').mockImplementation(() => {
      return mockGoogleService(address, apiType);
    });

    await service.buildLngLatByAddress({ address, apiType });
    expect(service.saveAddressLocally).toBeCalledWith(address, value, apiType);
  });

  it('get empty object from google service if address does not exist', async () => {
    const address = undefined;
    const apiType = 'countryOnly';

    jest.spyOn(service, 'checkAddressLocally').mockImplementation(() => {
      return mockCacheManager.get(address);
    });

    jest.spyOn(service, 'getAddressFromGoogle').mockImplementation(() => {
      return mockGoogleService(address, apiType);
    });
    const res = await service.buildLngLatByAddress({ address, apiType });
    expect(res).toMatchObject({ cached: false });
  });

  it('call checkAddressLocally, should call db with key (ex:"apiType_country")', async () => {
    const address = 'Germany';
    const apiType = 'countryOnly';
    await service.checkAddressLocally(address, apiType);
    expect(await mockCacheManager.get).toBeCalledWith(`${apiType}_${address}`);
  });

  it('call saveAddressLocally, should call db with key and value', async () => {
    const address = 'Germany';
    const apiType = 'countryOnly';
    const value = { country: 'Germany' };
    await service.saveAddressLocally(address, value, apiType);
    expect(await mockCacheManager.set).toBeCalledWith(
      `${apiType}_${address}`,
      value,
    );
  });
});
