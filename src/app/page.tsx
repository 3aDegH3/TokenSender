import AirdropForm from "@/components/AirdropForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-teal-400 mb-4">
              Token Airdrop
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Send tokens to multiple addresses in a single transaction with our gas-optimized bulk transfer solution.
            </p>
          </div>
          
          <div className="relative">
            {/* افکت‌های پس‌زمینه برای فرم */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl"></div>
              <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-900/10 to-teal-900/10 rounded-full filter blur-3xl"></div>
              <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-gradient-to-r from-purple-900/10 to-blue-900/10 rounded-full filter blur-3xl"></div>
            </div>
            
            {/* فرم اصلی */}
            <div className="relative bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 md:p-8 shadow-xl">
              <AirdropForm />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}