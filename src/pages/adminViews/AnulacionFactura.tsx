import React from 'react';
import AnulacionFactura from '../AnulacionFactura';

export default function AdminAnulacionFactura() {
  // PanelAdmin doesn't provide an onBack handler, so pass a noop
  return <AnulacionFactura onBack={() => {}} />;
}
