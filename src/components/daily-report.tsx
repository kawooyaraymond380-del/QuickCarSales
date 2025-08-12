'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/hooks/use-app';
import type { Service } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

export function DailyReport() {
  const { t, language, services, loadServicesForDate } = useApp();
  const [date, setDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    if (date) {
      loadServicesForDate(date);
    }
  }, [date, loadServicesForDate]);

  const reportData = useMemo(() => {
    let totalSales = 0;
    let totalCommissions = 0;
    const staffCommissions: { [key: string]: { name: string; amount: number } } = {};

    services.forEach(service => {
      totalSales += service.price;
      totalCommissions += service.commission;
      const staffName = language === 'ar' ? service.staffName : service.staffNameEn;
      if (staffCommissions[staffName]) {
        staffCommissions[staffName].amount += service.commission;
      } else {
        staffCommissions[staffName] = { name: staffName, amount: service.commission };
      }
    });

    return { totalSales, totalCommissions, staffCommissions };
  }, [services, language]);

  const getServiceTypeName = (serviceTypeId: string) => {
    return t(serviceTypeId as keyof typeof import('@/lib/translations').translations.en);
  };

  const getCarSizeName = (carSizeId: string | null) => {
    if (!carSizeId) return '-';
    const key = `${carSizeId}-car` as keyof typeof import('@/lib/translations').translations.en;
    return t(key);
  };

  const exportToCsv = () => {
    const headers = [
      t('table-header-time'), t('table-header-service'), t('table-header-size'),
      t('table-header-staff'), t('table-header-price'), t('table-header-commission')
    ].join(',');

    const rows = services.map(s => [
      format(new Date(s.timestamp), 'p', { locale: language === 'ar' ? arSA : undefined }),
      getServiceTypeName(s.serviceType),
      getCarSizeName(s.carSize),
      language === 'ar' ? s.staffName : s.staffNameEn,
      s.price,
      s.commission
    ].join(','));

    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `report-${format(date!, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="space-y-2">
                <Label>{t('report-date-label')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, 'PPP', { locale: language === 'ar' ? arSA : undefined }) : <span>{t('report-date-label')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            <Button onClick={exportToCsv} disabled={services.length === 0}>
              <Download className="h-4 w-4" />
              <span>{t('export-csv-text')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <CardHeader>
            <CardTitle>{t('total-sales-label')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.totalSales} {t('sar')}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary to-secondary text-primary-foreground">
          <CardHeader>
            <CardTitle>{t('total-commissions-label')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold mb-2">{reportData.totalCommissions} {t('sar')}</p>
            <div className="text-sm space-y-1">
              {Object.values(reportData.staffCommissions).map(staff => (
                <p key={staff.name}>{staff.name}: {staff.amount} {t('sar')}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('services-list-label')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('table-header-time')}</TableHead>
                <TableHead>{t('table-header-service')}</TableHead>
                <TableHead>{t('table-header-size')}</TableHead>
                <TableHead>{t('table-header-staff')}</TableHead>
                <TableHead className="text-right">{t('table-header-price')}</TableHead>
                <TableHead className="text-right">{t('table-header-commission')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length > 0 ? (
                services.map((s: Service) => (
                  <TableRow key={s.id}>
                    <TableCell>{format(new Date(s.timestamp), 'p', { locale: language === 'ar' ? arSA : undefined })}</TableCell>
                    <TableCell>{getServiceTypeName(s.serviceType)}</TableCell>
                    <TableCell>{getCarSizeName(s.carSize)}</TableCell>
                    <TableCell>{language === 'ar' ? s.staffName : s.staffNameEn}</TableCell>
                    <TableCell className="text-right">{s.price}</TableCell>
                    <TableCell className="text-right">{s.commission}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">{t('no-records-text')}</TableCell>
                </TableRow>
              )}
            </TableBody>
             <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} className="font-bold">{t('table-footer-totals')}</TableCell>
                  <TableCell className="text-right font-bold">{reportData.totalSales} {t('sar')}</TableCell>
                  <TableCell className="text-right font-bold">{reportData.totalCommissions} {t('sar')}</TableCell>
                </TableRow>
              </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
