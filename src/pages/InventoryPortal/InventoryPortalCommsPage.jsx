import React, { useState } from 'react';
import StockDiscrepancyComms from './components/StockDiscrepancyComms';
import NewDiscrepancyModal from './components/NewDiscrepancyModal';
import { useInventory } from '../../context/InventoryContext';
import { useInventoryComms } from './context/InventoryCommsContext';

const InventoryPortalCommsPage = () => {
  const { inventory } = useInventory();
  const { createTicket } = useInventoryComms();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-4 pb-8">
      <StockDiscrepancyComms onOpenNewTicketModal={() => setIsModalOpen(true)} />

      <NewDiscrepancyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        inventory={inventory}
        onSubmitTicket={createTicket}
      />
    </div>
  );
};

export default InventoryPortalCommsPage;
