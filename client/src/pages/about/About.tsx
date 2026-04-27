import React, { useEffect } from 'react'

const About: React.FC = () => {
  useEffect(() => {
    document.title = "Earn - The story";
  }, []);

  return (
    <>
      <div className="min-h-screen five bg-white text-[#1a1a1a] selection:bg-black selection:text-white px-6 pt-16 pb-24 font-sans antialiased">
        <div className="max-w-[620px] mx-auto">

          <a href="/" className="flex justify-start mb-16">
            <img className='w-22' src="/images/earn.png" />
          </a>

          <div className="mb-12 text-[#8c8c8c] text-[15px] leading-relaxed">
            <div className="mt-8 space-y-0.5">
              <p>by: arijit.</p>
              <p>published: apr 27, 2026.</p>
            </div>
          </div>

          <article className="text-[18px] leading-[1.8] tracking-[-0.011em] text-[#1a1a1a] space-y-10">
            <p>so, earn.</p>

            <p>
              it started with a frustration. freelancers get paid late, or not at all.
              clients send money and hope for the best. there is no system, no guarantee,
              no accountability. just trust, and trust breaks.
            </p>

            <p>
              so i built earn. a freelance marketplace that runs on solana, where funds
              are locked in an on-chain vault the moment a job is accepted. neither side
              can touch the money until the work is done and approved. no middlemen. no
              disputes that go nowhere. the code is the contract.
            </p>

            <p>
              the way it works is simple. a client posts a job, breaks it into milestones,
              and locks the full amount in escrow upfront. the freelancer submits work
              at each milestone. the client approves it. sol transfers instantly to the
              freelancer's wallet. if something goes wrong, there is an on-chain
              arbitration process that reviews the evidence and decides.
            </p>

            <p>
              there are no passwords. you connect your phantom wallet, sign a message,
              and you are in. your wallet is your identity. your completed jobs, your
              approvals, your disputes — all of it is recorded on-chain and follows you
              everywhere. your reputation cannot be faked or deleted.
            </p>

            <p>
              under the hood it is a react frontend talking to a solana program written
              in anchor. the escrow logic lives entirely on-chain — the api cannot
              release funds, the frontend cannot release funds, only the program can,
              and only when the right conditions are met. postgres on neondb stores
              job metadata and proposals. jwt handles sessions after wallet auth.
            </p>

            <p>
              it is not perfect. on-chain arbitration is still early. the marketplace
              is small. solana has its own quirks that make certain things harder than
              they should be. but the core of it works — you can post a job, get hired,
              submit work, get paid, and never once wonder if the money is real.
            </p>

            <p>
              that is the part i care about. freelancers should not have to chase
              invoices. clients should not have to hope their hire delivers. earn
              makes both sides feel safe by making trust unnecessary.
            </p>

            <p>
              all in all, i think this is one of the more useful things i have built.
            </p>
          </article>

        </div>
      </div>
    </>
  )
}

export default About